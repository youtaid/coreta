export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      ai_decisions: {
        Row: {
          component: string;
          cost: number;
          created_at: string;
          id: string;
          input_ref: string | null;
          latency_ms: number | null;
          model: string | null;
          output: Json;
          prompt_version: string | null;
          rule_or_signal: string | null;
          subject_id: string | null;
          tokens_in: number;
          tokens_out: number;
        };
        Insert: {
          component: string;
          cost?: number;
          created_at?: string;
          id?: string;
          input_ref?: string | null;
          latency_ms?: number | null;
          model?: string | null;
          output?: Json;
          prompt_version?: string | null;
          rule_or_signal?: string | null;
          subject_id?: string | null;
          tokens_in?: number;
          tokens_out?: number;
        };
        Update: {
          component?: string;
          cost?: number;
          created_at?: string;
          id?: string;
          input_ref?: string | null;
          latency_ms?: number | null;
          model?: string | null;
          output?: Json;
          prompt_version?: string | null;
          rule_or_signal?: string | null;
          subject_id?: string | null;
          tokens_in?: number;
          tokens_out?: number;
        };
        Relationships: [
          {
            foreignKeyName: "ai_decisions_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      assignments: {
        Row: {
          assigned_at: string;
          completed_at: string | null;
          id: string;
          student_id: string;
          worksheet_id: string;
        };
        Insert: {
          assigned_at?: string;
          completed_at?: string | null;
          id?: string;
          student_id: string;
          worksheet_id: string;
        };
        Update: {
          assigned_at?: string;
          completed_at?: string | null;
          id?: string;
          student_id?: string;
          worksheet_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "assignments_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assignments_worksheet_id_fkey";
            columns: ["worksheet_id"];
            isOneToOne: false;
            referencedRelation: "worksheets";
            referencedColumns: ["id"];
          },
        ];
      };
      attempts: {
        Row: {
          answer: Json;
          assignment_id: string;
          duration_ms: number;
          id: string;
          item_id: string;
          received_at: string;
          score: number;
          student_id: string;
          submitted_at: string;
          try_no: number;
        };
        Insert: {
          answer: Json;
          assignment_id: string;
          duration_ms: number;
          id: string;
          item_id: string;
          received_at?: string;
          score: number;
          student_id: string;
          submitted_at: string;
          try_no?: number;
        };
        Update: {
          answer?: Json;
          assignment_id?: string;
          duration_ms?: number;
          id?: string;
          item_id?: string;
          received_at?: string;
          score?: number;
          student_id?: string;
          submitted_at?: string;
          try_no?: number;
        };
        Relationships: [
          {
            foreignKeyName: "attempts_assignment_id_student_id_fkey";
            columns: ["assignment_id", "student_id"];
            isOneToOne: false;
            referencedRelation: "assignments";
            referencedColumns: ["id", "student_id"];
          },
          {
            foreignKeyName: "attempts_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attempts_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "items_public";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_log: {
        Row: {
          action: string;
          actor_id: string | null;
          at: string;
          details: Json;
          id: number;
          target: string;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          at?: string;
          details?: Json;
          id?: never;
          target: string;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          at?: string;
          details?: Json;
          id?: never;
          target?: string;
        };
        Relationships: [];
      };
      competencies: {
        Row: {
          code: string;
          domain: string;
          exam_tags: string[];
          id: string;
          name: string;
          stage_id: string;
        };
        Insert: {
          code: string;
          domain: string;
          exam_tags?: string[];
          id?: string;
          name: string;
          stage_id: string;
        };
        Update: {
          code?: string;
          domain?: string;
          exam_tags?: string[];
          id?: string;
          name?: string;
          stage_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "competencies_stage_id_fkey";
            columns: ["stage_id"];
            isOneToOne: false;
            referencedRelation: "stages";
            referencedColumns: ["id"];
          },
        ];
      };
      competency_prereqs: {
        Row: {
          competency_id: string;
          prereq_id: string;
        };
        Insert: {
          competency_id: string;
          prereq_id: string;
        };
        Update: {
          competency_id?: string;
          prereq_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "competency_prereqs_competency_id_fkey";
            columns: ["competency_id"];
            isOneToOne: false;
            referencedRelation: "competencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "competency_prereqs_prereq_id_fkey";
            columns: ["prereq_id"];
            isOneToOne: false;
            referencedRelation: "competencies";
            referencedColumns: ["id"];
          },
        ];
      };
      consents: {
        Row: {
          granted: boolean;
          granted_at: string;
          parent_id: string;
          type: string;
          version: string;
        };
        Insert: {
          granted: boolean;
          granted_at?: string;
          parent_id: string;
          type: string;
          version: string;
        };
        Update: {
          granted?: boolean;
          granted_at?: string;
          parent_id?: string;
          type?: string;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: "consents_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      conversations: {
        Row: {
          audience: string;
          created_at: string;
          id: string;
          label: string | null;
          level: number;
          owner_id: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          audience: string;
          created_at?: string;
          id?: string;
          label?: string | null;
          level?: number;
          owner_id: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          audience?: string;
          created_at?: string;
          id?: string;
          label?: string | null;
          level?: number;
          owner_id?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conversations_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_events: {
        Row: {
          action: string;
          fired_at: string;
          id: string;
          outcome: string | null;
          signal: string;
          subject_id: string;
        };
        Insert: {
          action: string;
          fired_at?: string;
          id?: string;
          outcome?: string | null;
          signal: string;
          subject_id: string;
        };
        Update: {
          action?: string;
          fired_at?: string;
          id?: string;
          outcome?: string | null;
          signal?: string;
          subject_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_events_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      daily_activity: {
        Row: {
          date: string;
          items_done: number;
          minutes: number;
          student_id: string;
          target_met: boolean;
          updated_at: string;
        };
        Insert: {
          date: string;
          items_done?: number;
          minutes?: number;
          student_id: string;
          target_met?: boolean;
          updated_at?: string;
        };
        Update: {
          date?: string;
          items_done?: number;
          minutes?: number;
          student_id?: string;
          target_met?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "daily_activity_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      guardianships: {
        Row: {
          consent_at: string | null;
          consent_version: string | null;
          parent_id: string;
          student_id: string;
        };
        Insert: {
          consent_at?: string | null;
          consent_version?: string | null;
          parent_id: string;
          student_id: string;
        };
        Update: {
          consent_at?: string | null;
          consent_version?: string | null;
          parent_id?: string;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "guardianships_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "guardianships_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      hint_reports: {
        Row: {
          attempt_id: string;
          created_at: string;
          due_at: string;
          id: string;
          reason: string;
          resolution: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: string;
          student_id: string;
        };
        Insert: {
          attempt_id: string;
          created_at?: string;
          due_at?: string;
          id?: string;
          reason: string;
          resolution?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          student_id: string;
        };
        Update: {
          attempt_id?: string;
          created_at?: string;
          due_at?: string;
          id?: string;
          reason?: string;
          resolution?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hint_reports_attempt_id_student_id_fkey";
            columns: ["attempt_id", "student_id"];
            isOneToOne: false;
            referencedRelation: "attempts";
            referencedColumns: ["id", "student_id"];
          },
          {
            foreignKeyName: "hint_reports_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      hints_shown: {
        Row: {
          ai_decision_id: string | null;
          attempt_id: string;
          id: string;
          shown_at: string;
          source: string;
          student_id: string;
          text: string;
        };
        Insert: {
          ai_decision_id?: string | null;
          attempt_id: string;
          id?: string;
          shown_at?: string;
          source: string;
          student_id: string;
          text: string;
        };
        Update: {
          ai_decision_id?: string | null;
          attempt_id?: string;
          id?: string;
          shown_at?: string;
          source?: string;
          student_id?: string;
          text?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hints_shown_ai_decision_id_fkey";
            columns: ["ai_decision_id"];
            isOneToOne: false;
            referencedRelation: "ai_decisions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hints_shown_attempt_id_student_id_fkey";
            columns: ["attempt_id", "student_id"];
            isOneToOne: false;
            referencedRelation: "attempts";
            referencedColumns: ["id", "student_id"];
          },
        ];
      };
      ink_sessions: {
        Row: {
          attempt_id: string;
          created_at: string;
          duration_ms: number;
          format_version: number;
          id: string;
          item_id: string;
          snapshot_path: string | null;
          storage_path: string;
          stroke_count: number;
          student_id: string;
        };
        Insert: {
          attempt_id: string;
          created_at?: string;
          duration_ms?: number;
          format_version?: number;
          id?: string;
          item_id: string;
          snapshot_path?: string | null;
          storage_path: string;
          stroke_count?: number;
          student_id: string;
        };
        Update: {
          attempt_id?: string;
          created_at?: string;
          duration_ms?: number;
          format_version?: number;
          id?: string;
          item_id?: string;
          snapshot_path?: string | null;
          storage_path?: string;
          stroke_count?: number;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ink_sessions_attempt_id_student_id_item_id_fkey";
            columns: ["attempt_id", "student_id", "item_id"];
            isOneToOne: false;
            referencedRelation: "attempts";
            referencedColumns: ["id", "student_id", "item_id"];
          },
        ];
      };
      invoices: {
        Row: {
          amount: number;
          created_at: string;
          id: string;
          number: string;
          paid_at: string | null;
          parent_id: string;
          pdf_path: string | null;
          provider_id: string | null;
          refunded_at: string | null;
          status: string;
          subscription_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          id?: string;
          number: string;
          paid_at?: string | null;
          parent_id: string;
          pdf_path?: string | null;
          provider_id?: string | null;
          refunded_at?: string | null;
          status?: string;
          subscription_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          id?: string;
          number?: string;
          paid_at?: string | null;
          parent_id?: string;
          pdf_path?: string | null;
          provider_id?: string | null;
          refunded_at?: string | null;
          status?: string;
          subscription_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_subscription_id_parent_id_fkey";
            columns: ["subscription_id", "parent_id"];
            isOneToOne: false;
            referencedRelation: "subscriptions";
            referencedColumns: ["id", "parent_id"];
          },
        ];
      };
      items: {
        Row: {
          answer_key: Json;
          answer_type: string;
          code: string;
          competency_id: string;
          created_at: string;
          difficulty: number;
          distractor_hints: Json;
          equivalents: Json;
          explanation: Json;
          id: string;
          layout_mode: string;
          options: Json;
          status: string;
          stem: Json;
          stimulus_id: string | null;
          tier: string;
          tolerance: number | null;
          version: number;
        };
        Insert: {
          answer_key: Json;
          answer_type: string;
          code: string;
          competency_id: string;
          created_at?: string;
          difficulty: number;
          distractor_hints?: Json;
          equivalents?: Json;
          explanation?: Json;
          id?: string;
          layout_mode: string;
          options?: Json;
          status?: string;
          stem: Json;
          stimulus_id?: string | null;
          tier: string;
          tolerance?: number | null;
          version?: number;
        };
        Update: {
          answer_key?: Json;
          answer_type?: string;
          code?: string;
          competency_id?: string;
          created_at?: string;
          difficulty?: number;
          distractor_hints?: Json;
          equivalents?: Json;
          explanation?: Json;
          id?: string;
          layout_mode?: string;
          options?: Json;
          status?: string;
          stem?: Json;
          stimulus_id?: string | null;
          tier?: string;
          tolerance?: number | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "items_competency_id_fkey";
            columns: ["competency_id"];
            isOneToOne: false;
            referencedRelation: "competencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "items_stimulus_id_fkey";
            columns: ["stimulus_id"];
            isOneToOne: false;
            referencedRelation: "stimuli";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "items_stimulus_id_fkey";
            columns: ["stimulus_id"];
            isOneToOne: false;
            referencedRelation: "stimuli_public";
            referencedColumns: ["id"];
          },
        ];
      };
      login_throttle: {
        Row: {
          failures: number;
          key: string;
          locked_until: string | null;
          window_started_at: string;
        };
        Insert: {
          failures?: number;
          key: string;
          locked_until?: string | null;
          window_started_at?: string;
        };
        Update: {
          failures?: number;
          key?: string;
          locked_until?: string | null;
          window_started_at?: string;
        };
        Relationships: [];
      };
      mastery: {
        Row: {
          competency_id: string;
          mastered_at: string | null;
          n_attempts: number;
          next_review_at: string | null;
          review_step: number;
          revoked_at: string | null;
          score: number;
          student_id: string;
          tier: string;
          updated_at: string;
        };
        Insert: {
          competency_id: string;
          mastered_at?: string | null;
          n_attempts?: number;
          next_review_at?: string | null;
          review_step?: number;
          revoked_at?: string | null;
          score?: number;
          student_id: string;
          tier?: string;
          updated_at?: string;
        };
        Update: {
          competency_id?: string;
          mastered_at?: string | null;
          n_attempts?: number;
          next_review_at?: string | null;
          review_step?: number;
          revoked_at?: string | null;
          score?: number;
          student_id?: string;
          tier?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mastery_competency_id_fkey";
            columns: ["competency_id"];
            isOneToOne: false;
            referencedRelation: "competencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mastery_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      media_assets: {
        Row: {
          alt_text: string;
          caption_path: string | null;
          duration_s: number | null;
          height: number | null;
          id: string;
          kind: string;
          pasteable: boolean;
          storage_path: string;
          transcript: string | null;
          width: number | null;
        };
        Insert: {
          alt_text: string;
          caption_path?: string | null;
          duration_s?: number | null;
          height?: number | null;
          id?: string;
          kind: string;
          pasteable?: boolean;
          storage_path: string;
          transcript?: string | null;
          width?: number | null;
        };
        Update: {
          alt_text?: string;
          caption_path?: string | null;
          duration_s?: number | null;
          height?: number | null;
          id?: string;
          kind?: string;
          pasteable?: boolean;
          storage_path?: string;
          transcript?: string | null;
          width?: number | null;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          body: string;
          conversation_id: string;
          created_at: string;
          id: string;
          owner_id: string;
          sender: string;
          tool_calls: Json;
        };
        Insert: {
          body: string;
          conversation_id: string;
          created_at?: string;
          id?: string;
          owner_id: string;
          sender: string;
          tool_calls?: Json;
        };
        Update: {
          body?: string;
          conversation_id?: string;
          created_at?: string;
          id?: string;
          owner_id?: string;
          sender?: string;
          tool_calls?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_owner_id_fkey";
            columns: ["conversation_id", "owner_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id", "owner_id"];
          },
        ];
      };
      notifications: {
        Row: {
          body: string;
          created_at: string;
          id: string;
          kind: string;
          read_at: string | null;
          recipient_id: string;
          title: string;
        };
        Insert: {
          body?: string;
          created_at?: string;
          id?: string;
          kind: string;
          read_at?: string | null;
          recipient_id: string;
          title: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          id?: string;
          kind?: string;
          read_at?: string | null;
          recipient_id?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      payment_events: {
        Row: {
          error: string | null;
          id: string;
          payload: Json;
          processed_at: string | null;
          provider: string;
          provider_event_id: string;
          received_at: string;
        };
        Insert: {
          error?: string | null;
          id?: string;
          payload: Json;
          processed_at?: string | null;
          provider: string;
          provider_event_id: string;
          received_at?: string;
        };
        Update: {
          error?: string | null;
          id?: string;
          payload?: Json;
          processed_at?: string | null;
          provider?: string;
          provider_event_id?: string;
          received_at?: string;
        };
        Relationships: [];
      };
      plans: {
        Row: {
          id: string;
          months: number;
          name: string;
          price: number;
          sort_order: number;
          strike_price: number | null;
        };
        Insert: {
          id: string;
          months: number;
          name: string;
          price: number;
          sort_order?: number;
          strike_price?: number | null;
        };
        Update: {
          id?: string;
          months?: number;
          name?: string;
          price?: number;
          sort_order?: number;
          strike_price?: number | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string | null;
          id: string;
          role: string;
        };
        Insert: {
          created_at?: string;
          full_name?: string | null;
          id: string;
          role: string;
        };
        Update: {
          created_at?: string;
          full_name?: string | null;
          id?: string;
          role?: string;
        };
        Relationships: [];
      };
      stages: {
        Row: {
          goal_scope: string;
          id: string;
          name: string;
          number: number;
        };
        Insert: {
          goal_scope?: string;
          id?: string;
          name: string;
          number: number;
        };
        Update: {
          goal_scope?: string;
          id?: string;
          name?: string;
          number?: number;
        };
        Relationships: [];
      };
      stimuli: {
        Row: {
          body: Json;
          id: string;
          kind: string;
        };
        Insert: {
          body: Json;
          id?: string;
          kind: string;
        };
        Update: {
          body?: Json;
          id?: string;
          kind?: string;
        };
        Relationships: [];
      };
      students: {
        Row: {
          created_at: string;
          daily_target: number;
          device_note: string | null;
          goal: string;
          grade: number | null;
          id: string;
          login_code: string | null;
          profile_id: string;
        };
        Insert: {
          created_at?: string;
          daily_target?: number;
          device_note?: string | null;
          goal?: string;
          grade?: number | null;
          id?: string;
          login_code?: string | null;
          profile_id: string;
        };
        Update: {
          created_at?: string;
          daily_target?: number;
          device_note?: string | null;
          goal?: string;
          grade?: number | null;
          id?: string;
          login_code?: string | null;
          profile_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "students_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean;
          created_at: string;
          current_period_end: string;
          id: string;
          parent_id: string;
          paused_until: string | null;
          plan_id: string;
          renewal_method: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          cancel_at_period_end?: boolean;
          created_at?: string;
          current_period_end: string;
          id?: string;
          parent_id: string;
          paused_until?: string | null;
          plan_id: string;
          renewal_method?: string;
          status: string;
          updated_at?: string;
        };
        Update: {
          cancel_at_period_end?: boolean;
          created_at?: string;
          current_period_end?: string;
          id?: string;
          parent_id?: string;
          paused_until?: string | null;
          plan_id?: string;
          renewal_method?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "plans";
            referencedColumns: ["id"];
          },
        ];
      };
      weekly_reports: {
        Row: {
          created_at: string;
          id: string;
          metrics: Json;
          narrative: string | null;
          published_at: string | null;
          sample_ink_id: string | null;
          status: string;
          student_id: string;
          week_start: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          metrics?: Json;
          narrative?: string | null;
          published_at?: string | null;
          sample_ink_id?: string | null;
          status?: string;
          student_id: string;
          week_start: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          metrics?: Json;
          narrative?: string | null;
          published_at?: string | null;
          sample_ink_id?: string | null;
          status?: string;
          student_id?: string;
          week_start?: string;
        };
        Relationships: [
          {
            foreignKeyName: "weekly_reports_sample_ink_id_student_id_fkey";
            columns: ["sample_ink_id", "student_id"];
            isOneToOne: false;
            referencedRelation: "ink_sessions";
            referencedColumns: ["id", "student_id"];
          },
          {
            foreignKeyName: "weekly_reports_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      worksheet_items: {
        Row: {
          item_id: string;
          position: number;
          slot: string;
          worksheet_id: string;
        };
        Insert: {
          item_id: string;
          position: number;
          slot: string;
          worksheet_id: string;
        };
        Update: {
          item_id?: string;
          position?: number;
          slot?: string;
          worksheet_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "worksheet_items_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "worksheet_items_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "items_public";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "worksheet_items_worksheet_id_fkey";
            columns: ["worksheet_id"];
            isOneToOne: false;
            referencedRelation: "worksheets";
            referencedColumns: ["id"];
          },
        ];
      };
      worksheets: {
        Row: {
          id: string;
          release_at: string;
          stage_id: string;
          status: string;
          title: string;
        };
        Insert: {
          id?: string;
          release_at: string;
          stage_id: string;
          status?: string;
          title: string;
        };
        Update: {
          id?: string;
          release_at?: string;
          stage_id?: string;
          status?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "worksheets_stage_id_fkey";
            columns: ["stage_id"];
            isOneToOne: false;
            referencedRelation: "stages";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      items_public: {
        Row: {
          answer_type: string | null;
          code: string | null;
          competency_id: string | null;
          difficulty: number | null;
          id: string | null;
          layout_mode: string | null;
          options: Json | null;
          stem: Json | null;
          stimulus_id: string | null;
          tier: string | null;
          version: number | null;
        };
        Insert: {
          answer_type?: string | null;
          code?: string | null;
          competency_id?: string | null;
          difficulty?: number | null;
          id?: string | null;
          layout_mode?: string | null;
          options?: never;
          stem?: never;
          stimulus_id?: string | null;
          tier?: string | null;
          version?: number | null;
        };
        Update: {
          answer_type?: string | null;
          code?: string | null;
          competency_id?: string | null;
          difficulty?: number | null;
          id?: string | null;
          layout_mode?: string | null;
          options?: never;
          stem?: never;
          stimulus_id?: string | null;
          tier?: string | null;
          version?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "items_competency_id_fkey";
            columns: ["competency_id"];
            isOneToOne: false;
            referencedRelation: "competencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "items_stimulus_id_fkey";
            columns: ["stimulus_id"];
            isOneToOne: false;
            referencedRelation: "stimuli";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "items_stimulus_id_fkey";
            columns: ["stimulus_id"];
            isOneToOne: false;
            referencedRelation: "stimuli_public";
            referencedColumns: ["id"];
          },
        ];
      };
      media_assets_public: {
        Row: {
          alt_text: string | null;
          caption_path: string | null;
          duration_s: number | null;
          height: number | null;
          id: string | null;
          kind: string | null;
          pasteable: boolean | null;
          storage_path: string | null;
          transcript: string | null;
          width: number | null;
        };
        Insert: {
          alt_text?: string | null;
          caption_path?: string | null;
          duration_s?: number | null;
          height?: number | null;
          id?: string | null;
          kind?: string | null;
          pasteable?: boolean | null;
          storage_path?: string | null;
          transcript?: string | null;
          width?: number | null;
        };
        Update: {
          alt_text?: string | null;
          caption_path?: string | null;
          duration_s?: number | null;
          height?: number | null;
          id?: string | null;
          kind?: string | null;
          pasteable?: boolean | null;
          storage_path?: string | null;
          transcript?: string | null;
          width?: number | null;
        };
        Relationships: [];
      };
      stimuli_public: {
        Row: {
          body: Json | null;
          id: string | null;
          kind: string | null;
        };
        Insert: {
          body?: never;
          id?: string | null;
          kind?: string | null;
        };
        Update: {
          body?: never;
          id?: string | null;
          kind?: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      auth_role: { Args: never; Returns: string };
      can_read_student_folder: { Args: { folder: string }; Returns: boolean };
      clear_login_failures: {
        Args: { throttle_key: string };
        Returns: undefined;
      };
      current_student_id: { Args: never; Returns: string };
      is_guardian_of: { Args: { target_student: string }; Returns: boolean };
      is_guardian_of_profile: {
        Args: { target_profile: string };
        Returns: boolean;
      };
      login_locked_until: { Args: { throttle_key: string }; Returns: string };
      note_login_failure: {
        Args: {
          lock_seconds: number;
          max_failures: number;
          throttle_key: string;
          window_seconds: number;
        };
        Returns: string;
      };
      record_consent: {
        Args: {
          actor: string;
          consent_type: string;
          is_granted: boolean;
          source: string;
          target_parent: string;
          text_version: string;
        };
        Returns: {
          granted: boolean;
          granted_at: string;
          parent_id: string;
          type: string;
          version: string;
        };
        SetofOptions: {
          from: "*";
          to: "consents";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      register_student: {
        Args: {
          code: string;
          required_consent_version: string;
          student_daily_target: number;
          student_goal: string;
          student_grade: number;
          student_profile: string;
          target_parent: string;
        };
        Returns: {
          created_at: string;
          daily_target: number;
          device_note: string | null;
          goal: string;
          grade: number | null;
          id: string;
          login_code: string | null;
          profile_id: string;
        };
        SetofOptions: {
          from: "*";
          to: "students";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      revoke_user_sessions: { Args: { target_user: string }; Returns: number };
      uuid_generate_v7: { Args: never; Returns: string };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
