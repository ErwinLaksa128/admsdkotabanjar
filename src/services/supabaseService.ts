
import { supabase } from '../lib/supabase';
import { User, SupervisionReport, SchoolVisit } from './storage';

const SETTINGS_TABLE = 'settings';
const USERS_TABLE = 'users';
const SUPERVISIONS_TABLE = 'supervisions'; // renamed from supervisions_v3
const GENERATED_DOCS_TABLE = 'generated_docs';
const SCHOOL_STATS_TABLE = 'school_stats';
const SCHOOL_VISITS_TABLE = 'school_visits';

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
    // 1. Get initial data
    supabase
      .from(SETTINGS_TABLE)
      .select('text')
      .eq('id', 'running_text')
      .single()
      .then(({ data }) => {
        if (data) callback(data.text);
        else callback('Selamat Datang di Sistem Administrasi Guru (Mode Online)');
      });

    // 2. Subscribe to changes
    const channel = supabase
      .channel('public:settings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: SETTINGS_TABLE, filter: 'id=eq.running_text' },
        (payload) => {
            const newData = payload.new as { text: string };
            if (newData && newData.text) callback(newData.text);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Save Running Text
  saveRunningText: async (text: string) => {
    const { error } = await supabase
      .from(SETTINGS_TABLE)
      .upsert({ id: 'running_text', text, updated_at: new Date().toISOString() });
    
    if (error) throw error;
    return true;
  },

  // Subscribe to Users
  subscribeUsers: (callback: (users: User[]) => void, onError?: (error: any) => void) => {
    // Initial fetch
    supabase.from(USERS_TABLE).select('*').then(({ data, error }) => {
      if (error) {
        if (onError) onError(error);
      } else {
        callback(data as User[]);
      }
    });

    // Realtime subscription
    const channel = supabase
      .channel('public:users')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: USERS_TABLE },
        () => {
          // Re-fetch all users on any change (simplest approach for small datasets)
          // Optimization: Update local state based on payload
          supabase.from(USERS_TABLE).select('*').then(({ data }) => {
             if (data) callback(data as User[]);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Save User
  saveUser: async (user: User) => {
    const { error } = await supabase
      .from(USERS_TABLE)
      .upsert(user, { onConflict: 'nip' });
    
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
     // Initial
     supabase
       .from(SUPERVISIONS_TABLE)
       .select('*')
       .eq('school', school)
       .order('date', { ascending: false })
       .then(({ data }) => {
          if (data) callback(data as SupervisionReport[]);
       });

     const channel = supabase
       .channel(`supervisions:${school}`)
       .on(
         'postgres_changes',
         { event: '*', schema: 'public', table: SUPERVISIONS_TABLE, filter: `school=eq.${school}` },
         () => {
            supabase
              .from(SUPERVISIONS_TABLE)
              .select('*')
              .eq('school', school)
              .order('date', { ascending: false })
              .then(({ data }) => {
                 if (data) callback(data as SupervisionReport[]);
              });
         }
       )
       .subscribe();

     return () => {
       supabase.removeChannel(channel);
     };
  },

  // Subscribe All Supervisions
  subscribeAllSupervisions: (callback: (reports: SupervisionReport[]) => void) => {
    supabase
       .from(SUPERVISIONS_TABLE)
       .select('*')
       .order('date', { ascending: false })
       .then(({ data }) => {
          if (data) callback(data as SupervisionReport[]);
       });

    const channel = supabase
       .channel('all_supervisions')
       .on(
         'postgres_changes',
         { event: '*', schema: 'public', table: SUPERVISIONS_TABLE },
         () => {
            supabase
              .from(SUPERVISIONS_TABLE)
              .select('*')
              .order('date', { ascending: false })
              .then(({ data }) => {
                 if (data) callback(data as SupervisionReport[]);
              });
         }
       )
       .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
    supabase
      .from(GENERATED_DOCS_TABLE)
      .select('*')
      .eq('school', school)
      .then(({ data }) => {
        if (data) callback(data);
      });

    const channel = supabase
      .channel(`generated_docs:${school}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: GENERATED_DOCS_TABLE, filter: `school=eq.${school}` },
        () => {
           supabase
             .from(GENERATED_DOCS_TABLE)
             .select('*')
             .eq('school', school)
             .then(({ data }) => {
                if (data) callback(data);
             });
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Save Generated Doc Log
  saveGeneratedDocLog: async (log: { school: string, docType: string, fileUrl: string, generatedBy: string }) => {
    const { error } = await supabase
      .from(GENERATED_DOCS_TABLE)
      .insert(log);
    
    if (error) throw error;
    return true;
  },

  // Subscribe to School Visits (by School Name)
  subscribeSchoolVisits: (schoolName: string, callback: (visits: SchoolVisit[]) => void) => {
    supabase
      .from(SCHOOL_VISITS_TABLE)
      .select('*')
      .eq('schoolName', schoolName)
      .order('date', { ascending: false })
      .then(({ data }) => {
        if (data) callback(data as SchoolVisit[]);
      });
      
    const channel = supabase
      .channel(`school_visits:${schoolName}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: SCHOOL_VISITS_TABLE, filter: `schoolName=eq.${schoolName}` },
        () => {
           supabase
             .from(SCHOOL_VISITS_TABLE)
             .select('*')
             .eq('schoolName', schoolName)
             .order('date', { ascending: false })
             .then(({ data }) => {
                if (data) callback(data as SchoolVisit[]);
             });
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Subscribe to Visits by Visitor
  subscribeVisitsByVisitor: (visitorNip: string, callback: (visits: SchoolVisit[]) => void) => {
     supabase
       .from(SCHOOL_VISITS_TABLE)
       .select('*')
       .eq('visitorNip', visitorNip)
       .order('date', { ascending: false })
       .then(({ data }) => {
          if (data) callback(data as SchoolVisit[]);
       });
    
    const channel = supabase
       .channel(`visits:${visitorNip}`)
       .on(
         'postgres_changes',
         { event: '*', schema: 'public', table: SCHOOL_VISITS_TABLE, filter: `visitorNip=eq.${visitorNip}` },
         () => {
            supabase
              .from(SCHOOL_VISITS_TABLE)
              .select('*')
              .eq('visitorNip', visitorNip)
              .order('date', { ascending: false })
              .then(({ data }) => {
                 if (data) callback(data as SchoolVisit[]);
              });
         }
       )
       .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Subscribe School Stats
  subscribeSchoolStats: (callback: (stats: any[]) => void) => {
    supabase
      .from(SCHOOL_STATS_TABLE)
      .select('*')
      .then(({ data }) => {
        if (data) callback(data);
      });

    const channel = supabase
      .channel('school_stats')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: SCHOOL_STATS_TABLE },
        () => {
            supabase
              .from(SCHOOL_STATS_TABLE)
              .select('*')
              .then(({ data }) => {
                if (data) callback(data);
              });
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }
};
