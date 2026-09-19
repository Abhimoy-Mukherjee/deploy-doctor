export type DiagnosisCategory =
  | 'build_failure'
  | 'missing_config'
  | 'port_conflict'
  | 'health_check_failure'
  | 'resource_limit'
  | 'dependency_conflict'
  | 'other';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface AutoFix {
  env_var_name: string;
  action?: 'add' | 'update' | string;
  value?: string;
  placeholder_value?: string;
}

export interface DiagnosisResponse {
  category: DiagnosisCategory;
  root_cause: string;
  evidence: string;
  suggested_fix: string;
  confidence: ConfidenceLevel;
  auto_fix: AutoFix | null;
}

export interface SampleScenario {
  id: string;
  category: DiagnosisCategory;
  label: string;
  rawLog: string;
}
