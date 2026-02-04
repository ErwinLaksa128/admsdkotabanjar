import { supabase } from '../lib/supabase';
import { User, SupervisionReport, SchoolVisit } from './storage';
import { RealtimeChannel } from '@supabase/supabase-js';

const SETTINGS_TABLE = 'settings';
const USERS_TABLE = 'users';
const SUPERVISIONS_TABLE = 'supervisions'; // renamed from supervisions_v3
const GENERATED_DOCS_TABLE = 'generated_docs';
const SCHOOL_STATS_TABLE = 'school_stats';
const SCHOOL_VISITS_TABLE = 'school_visits';

const parseJsonIfNeeded = (val: any): any => {
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      // Recursively parse if the result is still a string (handle double-encoded JSON)
      if (typeof parsed === 'string') {
        return parseJsonIfNeeded(parsed);
      }
      return parsed;
    } catch (e) {
      console.warn('Failed to parse JSON field:', val);
      return {};
    }
  }
  return val || {};
};

const normalizeUser = (u: any): User => ({
  ...u,
  // Handle potential case sensitivity issues for isPremium
  isPremium: u.isPremium !== undefined ? u.isPremium : (u.ispremium !== undefined ? u.ispremium : false),
  workloadEvidence_v2: parseJsonIfNeeded(u.workloadEvidence_v2 || u.workloadevidence_v2),
  workloadScores_v2: parseJsonIfNeeded(u.workloadScores_v2 || u.workloadscores_v2),
  workloadFeedback_v2: u.workloadFeedback_v2 || u.workloadfeedback_v2 || '',
  workloadFeedbackDate_v2: u.workloadFeedbackDate_v2 || u.workloadfeedbackdate_v2 || ''
});

// Helper for Robust Subscription with Retry
const subscribeWithRetry = (
  channelIdPrefix: string,
  config: { event: string; schema: string; table: string; filter?: string },
  onChange: (payload: any) => void,
  onError?: (err: any) => void,
  onReady?: () => void
): (() => void) => {
  let channel: RealtimeChannel | null = null;
  let retryTimeout: any = null;
  let isUnsubscribed = false;

  const setup = () => {
    if (isUnsubscribed) return;

    const channelId = `${channelIdPrefix}:${Date.now()}:${Math.random()}`;
    channel = supabase
      .channel(channelId)
      .on('postgres_changes', config as any, onChange)
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
           // Connection established/restored
           if (onReady) onReady();
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
           console.error(`Subscription error (${channelIdPrefix}): ${status}`, err);
           if (onError) onError(err || new Error(`Subscription status: ${status}`));
           
           // Retry after delay
           if (!isUnsubscribed) {
             if (channel) supabase.removeChannel(channel);
             retryTimeout = setTimeout(() => {
                console.log(`Retrying subscription for ${channelIdPrefix}...`);
                setup();
             }, 3000); // Retry after 3 seconds
           }
        }
      });
  };

  setup();

  return () => {
    isUnsubscribed = true;
    if (retryTimeout) clearTimeout(retryTimeout);
    if (channel) supabase.removeChannel(channel);
  };
};

export const supabaseService = {
  // Login with Google
  loginWithGoogle: async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin // Redirect back to home/dashboard
        }
      });

      if (error) throw error;
      
      // Note: Supabase OAuth with redirect doesn't return the user immediately.
      // The user will be available after redirect in onAuthStateChange.
      return { success: true, data };
    } catch (error) {
      console.error("Google Login Error:", error);
      throw error;
    }
  },

  // Logout
  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get Current Session User
  getCurrentSession: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user || null;
  },

  // Subscribe to Running Text
  subscribeRunningText: (callback: (text: string) => void) => {
    const fetch = () => {
      supabase
        .from(SETTINGS_TABLE)
        .select('text')
        .eq('id', 'running_text')
        .single()
        .then(
          ({ data, error }) => {
            if (error) {
               console.error('Error fetching running text:', error);
               callback('Selamat Datang di Sistem Administrasi Guru (Mode Offline)');
            } else if (data) {
               callback(data.text);
            } else {
               callback('Selamat Datang di Sistem Administrasi Guru (Mode Online)');
            }
          },
          (err: any) => {
             console.error('Network error fetching running text:', err);
             callback('Selamat Datang di Sistem Administrasi Guru (Mode Offline)');
          }
        );
    };

    fetch();

    // 2. Subscribe to changes
    return subscribeWithRetry(
      'public:settings',
      { event: '*', schema: 'public', table: SETTINGS_TABLE, filter: 'id=eq.running_text' },
      (payload) => {
          const newData = payload.new as { text: string };
          if (newData && newData.text) callback(newData.text);
      },
      undefined,
      fetch
    );
  },

  // Save Running Text
  saveRunningText: async (text: string) => {
    const { error } = await supabase
      .from(SETTINGS_TABLE)
      .upsert({ id: 'running_text', text, updated_at: new Date().toISOString() });
    
    if (error) throw error;
    return true;
  },

  // Get All Users (Normalized)
  getAllUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase.from(USERS_TABLE).select('*');
    if (error) throw error;
    
    return (data || []).map(normalizeUser) as User[];
  },

  // Subscribe to Users
  subscribeUsers: (callback: (users: User[]) => void, onError?: (error: any) => void) => {
    const fetch = () => {
      supabase.from(USERS_TABLE).select('*').then(
        ({ data, error }) => {
          if (error) {
            console.error('Initial users fetch error:', error);
            if (onError) onError(error);
          } else {
            const normalized = (data || []).map(normalizeUser);
            callback(normalized as User[]);
          }
        },
        (err: any) => {
          console.error('Initial users fetch network error:', err);
          if (onError) onError(err);
        }
      );
    };

    fetch();

    // Realtime subscription
    return subscribeWithRetry(
      'public:users_global_v2',
      { event: '*', schema: 'public', table: USERS_TABLE },
      (_payload) => {
          // Re-fetch all users on any change
          fetch();
      },
      onError,
      fetch
    );
  },

  // Subscribe to KS Workload by School (Specific optimization)
  subscribeKSWorkloadBySchool: (school: string, callback: (ks: User | null) => void) => {
    const fetch = () => {
      supabase
        .from(USERS_TABLE)
        .select('*')
        .eq('role', 'kepala-sekolah')
        .eq('school', school)
        .single()
        .then(({ data }) => {
          callback(data as User | null);
        });
    };

    fetch();

    // Subscribe to changes
    return subscribeWithRetry(
      `ks_workload:${school}`,
      { event: '*', schema: 'public', table: USERS_TABLE, filter: `school=eq.${school}` },
      (_payload) => {
           fetch();
      },
      undefined,
      fetch
    );
  },

  // Save User
  saveUser: async (user: User) => {
    // Sanitize user object to remove potential duplicate keys with different casing
    // e.g. ispremium vs isPremium
    const sanitizedUser = { ...user };
    if ('ispremium' in sanitizedUser) {
        delete (sanitizedUser as any).ispremium;
    }

    const { error } = await supabase
      .from(USERS_TABLE)
      .upsert(sanitizedUser, { onConflict: 'nip' });
    
    if (error) throw error;
    return true;
  },

  // Update User Premium Status
  updateUserPremium: async (nip: string, isPremium: boolean) => {
    const { error } = await supabase
      .from(USERS_TABLE)
      .update({ isPremium })
      .eq('nip', nip);
    
    if (error) throw error;
    return true;
  },

  // Delete User
  deleteUser: async (nip: string) => {
    const { error } = await supabase
      .from(USERS_TABLE)
      .delete()
      .eq('nip', nip);
    
    if (error) throw error;
    return true;
  },

  // Get User by NIP (Direct Fetch)
  getUserByNip: async (nip: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .select('*')
      .eq('nip', nip)
      .single();
    
    if (error || !data) return null;
    return data as User;
  },

  // Get Kepsek by School
  getKepsekBySchool: async (schoolName: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .select('*')
      .eq('role', 'kepala-sekolah')
      .eq('school', schoolName)
      .single();

    if (error || !data) return null;
    return data as User;
  },

  // Get Pengawas by School
  getPengawasBySchool: async (schoolName: string): Promise<User | null> => {
    // Note: managedSchools is likely a JSONB or array column. 
    // We use .contains to check if the array contains the schoolName.
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .select('*')
      .eq('role', 'pengawas')
      .contains('managedSchools', [schoolName])
      .limit(1) // Assuming one pengawas per school for now, or take the first one
      .maybeSingle();

    if (error || !data) return null;
    return data as User;
  },

  // Update Heartbeat
  updateHeartbeat: async (nip: string) => {
    await supabase
      .from(USERS_TABLE)
      .update({ lastSeen: new Date().toISOString() })
      .eq('nip', nip);
  },

  // Update Managed Schools
  updateManagedSchools: async (nip: string, schools: string[]) => {
    const { error } = await supabase
      .from(USERS_TABLE)
      .update({ managedSchools: schools })
      .eq('nip', nip);
    
    if (error) throw error;
    return true;
  },

  // Save Supervision Report
  saveSupervision: async (report: SupervisionReport & { school?: string }) => {
    const { error } = await supabase
      .from(SUPERVISIONS_TABLE)
      .upsert(report);
    
    if (error) {
        console.error('Error saving supervision:', error);
        return false;
    }
    return true;
  },

  // Subscribe to Supervisons by School
  subscribeSupervisionsBySchool: (school: string, callback: (reports: SupervisionReport[]) => void) => {
     const fetch = () => {
       supabase
         .from(SUPERVISIONS_TABLE)
         .select('*')
         .eq('school', school)
         .order('date', { ascending: false })
         .then(({ data }) => {
            if (data) callback(data as SupervisionReport[]);
         });
     };

     fetch();

     return subscribeWithRetry(
       `supervisions:${school}`,
       { event: '*', schema: 'public', table: SUPERVISIONS_TABLE, filter: `school=eq.${school}` },
       () => {
            fetch();
       },
       undefined,
       fetch
     );
  },

  // Subscribe All Supervisions
  subscribeAllSupervisions: (callback: (reports: SupervisionReport[]) => void) => {
    const fetch = () => {
      supabase
         .from(SUPERVISIONS_TABLE)
         .select('*')
         .order('date', { ascending: false })
         .then(({ data }) => {
            if (data) callback(data as SupervisionReport[]);
         });
    };

    fetch();

    return subscribeWithRetry(
      'all_supervisions',
      { event: '*', schema: 'public', table: SUPERVISIONS_TABLE },
      () => {
            fetch();
      },
      undefined,
      fetch
    );
  },

  // Save School Visit
  saveSchoolVisit: async (visit: SchoolVisit) => {
    const { error } = await supabase
      .from(SCHOOL_VISITS_TABLE)
      .upsert(visit);
    
    if (error) throw error;
    return true;
  },

  // Subscribe to Generated Docs by School
  subscribeGeneratedDocsBySchool: (school: string, callback: (logs: any[]) => void) => {
    const fetch = () => {
      supabase
        .from(GENERATED_DOCS_TABLE)
        .select('*')
        .eq('school', school)
        .then(({ data }) => {
          if (data) callback(data);
        });
    };

    fetch();

    return subscribeWithRetry(
      `generated_docs:${school}`,
      { event: '*', schema: 'public', table: GENERATED_DOCS_TABLE, filter: `school=eq.${school}` },
      () => {
           fetch();
      },
      undefined,
      fetch
    );
  },

  // Save Generated Doc Log
  saveGeneratedDocLog: async (log: any) => {
    const { error } = await supabase
      .from(GENERATED_DOCS_TABLE)
      .insert(log);
    
    if (error) throw error;
    return true;
  },

  // Subscribe to School Visits (by School Name)
  subscribeSchoolVisits: (schoolName: string, callback: (visits: SchoolVisit[]) => void) => {
    const fetch = () => {
      supabase
        .from(SCHOOL_VISITS_TABLE)
        .select('*')
        .eq('schoolName', schoolName)
        .order('date', { ascending: false })
        .then(({ data }) => {
          if (data) callback(data as SchoolVisit[]);
        });
    };
      
    fetch();

    return subscribeWithRetry(
      `school_visits:${schoolName}`,
      { event: '*', schema: 'public', table: SCHOOL_VISITS_TABLE, filter: `schoolName=eq.${schoolName}` },
      () => {
           fetch();
      },
      undefined,
      fetch
    );
  },

  // Subscribe to Visits by Visitor
  subscribeVisitsByVisitor: (visitorNip: string, callback: (visits: SchoolVisit[]) => void) => {
     const fetch = () => {
       supabase
         .from(SCHOOL_VISITS_TABLE)
         .select('*')
         .eq('visitorNip', visitorNip)
         .order('date', { ascending: false })
         .then(({ data }) => {
            if (data) callback(data as SchoolVisit[]);
         });
     };

    fetch();
    
    return subscribeWithRetry(
      `visits:${visitorNip}`,
      { event: '*', schema: 'public', table: SCHOOL_VISITS_TABLE, filter: `visitorNip=eq.${visitorNip}` },
      () => {
            fetch();
      },
      undefined,
      fetch
    );
  },

  // Subscribe School Stats
  subscribeSchoolStats: (callback: (stats: any[]) => void) => {
    const fetch = () => {
      supabase
        .from(SCHOOL_STATS_TABLE)
        .select('*')
        .then(({ data }) => {
          if (data) callback(data);
        });
    };

    fetch();

    return subscribeWithRetry(
      'school_stats',
      { event: '*', schema: 'public', table: SCHOOL_STATS_TABLE },
      () => {
            fetch();
      },
      undefined,
      fetch
    );
  }
};
