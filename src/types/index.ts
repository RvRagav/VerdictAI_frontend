// ============================================================
// VerdictAI — TypeScript interfaces matching API response types
// ============================================================

// --- Enums ---

export enum CriterionType {
  NUMERIC_THRESHOLD = 'numeric_threshold',
  CATEGORICAL_PRESENCE = 'categorical_presence',
  TEMPORAL_RECENCY = 'temporal_recency',
  COMPOSITE = 'composite',
  QUALITATIVE_ASSESSMENT = 'qualitative_assessment',
}

export enum Verdict {
  PASS = 'PASS',
  FAIL = 'FAIL',
  REVIEW = 'REVIEW',
}

export enum Route {
  AUTO_COMMIT = 'auto_commit',
  HITL_REVIEW = 'hitl_review',
  MANDATORY_REVIEW = 'mandatory_review',
}

// --- Tender ---

export interface Tender {
  id: string;
  title: string;
  department: string;
  category: string;
  status: string;
  ets_version: string | null;
  created_at: string;
  updated_at: string;
  documents?: Document[];
  bidders?: Bidder[];
}

// --- Document ---

export interface Document {
  id: string;
  tender_id: string;
  bidder_id: string | null;
  doc_type: 'nit' | 'corrigendum' | 'bidder_submission' | 'certificate';
  filename: string;
  file_path: string;
  sha256_hash: string;
  page_count: number;
  avg_ocr_confidence: number;
  upload_timestamp: string;
  processing_status: 'pending' | 'processing' | 'complete' | 'error';
}

export interface Page {
  id: string;
  document_id: string;
  page_number: number;
  image_path: string;
  ocr_confidence: number;
  raw_text: string;
  dpi: number;
  processing_notes: string;
}

export interface WordObject {
  id: string;
  page_id: string;
  text_content: string;
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
  confidence: number;
  source_engine: string;
}

// --- Bidder ---

export interface Bidder {
  id: string;
  tender_id: string;
  company_name: string;
  pan_number: string;
  registration_number: string;
  status: 'pending' | 'evaluating' | 'evaluated' | 'excluded';
  debarment_status: 'clear' | 'flagged' | 'excluded';
  debarment_check_timestamp: string | null;
}

// --- Criterion ---

export interface Criterion {
  id: string;
  tender_id: string;
  criterion_text: string;
  criterion_type: CriterionType;
  threshold_value: ThresholdValue | null;
  gfr_override_permitted: boolean;
  gfr_rule_number: string | null;
  source_document_id: string;
  source_clause_ref: string;
  amendment_history: AmendmentEntry[];
  is_mandatory: boolean;
  acceptable_evidence_types: string[];
  measurement_period: string | null;
  status: 'extracted' | 'reviewed' | 'approved';
  approved_by: string | null;
  approved_at: string | null;
}

export interface ThresholdValue {
  value: number | string;
  unit: string;
  period?: string;
}

export interface AmendmentEntry {
  value: string;
  corrigendum_id: string | null;
  amendment_date: string | null;
}

// --- Evidence ---

export interface Evidence {
  id: string;
  tender_id: string;
  bidder_id: string;
  criterion_id: string;
  extracted_value: unknown;
  source_document_id: string;
  source_page_number: number;
  source_bbox: BoundingBox;
  ocr_confidence: number;
  extraction_confidence: number;
  entity_match_flag: boolean;
}

export interface BoundingBox {
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
}

export interface EntityMatchResult {
  registered_name: string;
  extracted_name: string;
  similarity_score: number;
  is_match: boolean;
  mismatch_type: 'parent_company' | 'abbreviation' | 'different_entity' | null;
  requires_review: boolean;
}

// --- Evaluation ---

export interface Evaluation {
  id: string;
  tender_id: string;
  bidder_id: string;
  criterion_id: string;
  verdict: Verdict;
  confidence: number;
  evaluation_method: 'deterministic' | 'llm_stub' | 'cpm_assisted';
  route: Route;
  routing_reason: string;
  extracted_value: unknown;
  source_document_id: string;
  source_page_number: number;
  source_bbox: BoundingBox;
  ocr_confidence: number;
  extraction_confidence: number;
  entity_match_flag: boolean;
  officer_decision: 'confirmed' | 'overridden' | null;
  officer_id: string | null;
  officer_reason: string | null;
  officer_decision_timestamp: string | null;
  second_officer_id: string | null;
  second_officer_timestamp: string | null;
  status: 'pending' | 'auto_committed' | 'pending_review' | 'resolved';
  created_at: string;
  resolved_at: string | null;
}

export interface RoutingDecision {
  route: Route;
  confidence: number;
  reasons: string[];
  flags: string[];
  gfr_override_permitted: boolean;
  is_mandatory_criterion: boolean;
}

// --- Audit ---

export interface AuditEvent {
  id: number;
  tender_id: string;
  event_type: AuditEventType;
  event_data: Record<string, unknown>;
  actor: string;
  timestamp: string;
  prev_hash: string;
  entry_hash: string;
}

export type AuditEventType =
  | 'document_received'
  | 'ocr_completed'
  | 'corrigendum_linked'
  | 'schema_approved'
  | 'debarment_checked'
  | 'evidence_extracted'
  | 'verdict_computed'
  | 'case_routed'
  | 'officer_decision'
  | 'report_generated'
  | 'override_attempted';

// --- CPM ---

export interface CPMEntry {
  id: string;
  criterion_text: string;
  resolved_interpretation: string;
  department: string;
  tender_category: string;
  verdict: Verdict;
  officer_action: 'confirmed' | 'overridden';
  officer_id: string;
  tender_id: string;
  criterion_id: string;
  created_at: string;
}

// --- LLM Stub ---

export interface LLMStubRequest {
  prompt_type: 'criterion_extraction' | 'qualitative_evaluation' | 'similarity_assessment';
  context: Record<string, unknown>;
  tender_id: string;
  scenario_hint?: string;
}

export interface LLMStubResponse {
  result: Record<string, unknown>;
  confidence: number;
  reasoning: string;
  is_simulated: boolean;
  model_version: string;
  prompt_hash: string;
}

// --- API Error Response ---

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details: Record<string, unknown>;
    timestamp?: string;
    request_id?: string;
  };
}

// --- HITL Card Data ---

export interface HITLCardData {
  evaluation_id: string;
  criterion: Criterion;
  evidence: {
    extracted_value: unknown;
    source_document_id: string;
    source_page_number: number;
    source_bbox: BoundingBox;
    ocr_confidence: number;
    extraction_confidence: number;
    entity_match: EntityMatchResult | null;
    page_image_url: string;
  };
  analysis: {
    verdict: Verdict;
    confidence: number;
    evaluation_method: string;
    routing_reason: string;
    flags: string[];
  };
  cpm_precedents: CPMEntry[];
  decision_options: {
    can_confirm: boolean;
    can_override: boolean;
    override_disabled_reason: string | null;
    gfr_rule_number: string | null;
    requires_second_officer: boolean;
  };
}

// --- API Response Helpers ---

export interface TenderStatusResponse {
  status: string;
  progress_pct: number;
  current_step: string;
}

export interface EvaluationSummary {
  total: number;
  auto_committed: number;
  pending_review: number;
  completed: number;
  by_bidder: BidderSummaryItem[];
}

export interface BidderSummaryItem {
  bidder_id: string;
  company_name: string;
  total: number;
  pass: number;
  fail: number;
  review: number;
}

export interface DebarmentCheckResult {
  checked: number;
  flagged: Bidder[];
  clear: Bidder[];
}

export interface CorrigendumDiff {
  original: string;
  amended: string;
  corrigendum_id: string;
  amendment_date: string;
}
