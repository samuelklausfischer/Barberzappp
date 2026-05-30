/**
 * Logic Services Index
 * 
 * Export all business logic services
 */

export { evolutionAPI, mockEvolutionAPI, default as evolutionAPI } from './evolutionAPI';
export { autoReplyService, TEMPLATE_PRESETS, default as autoReplyService } from './autoReply';
export { clientService, getInitials, formatCurrency, formatRelativeTime, STATUS_COLORS, STATUS_LABELS } from './clientLogic';
export * as iaConfig from './iaConfig';
export { DEFAULT_IA_CONFIG, TONE_OPTIONS, MODEL_OPTIONS, getIAConfig, saveIAConfig, resetIAConfig, updateIAConfigSection, toggleSpecialistAgent, importKnowledgeBase, generateSystemPrompt, validateIAConfig, getAnalyticsData, simulateAIResponse } from './iaConfig';
export { appointmentService, financeiroService, formatCurrency as formatCurrencyAF, formatDate, formatDateShort, formatTime, getInitials as getInitialsAF, generateTimeSlots, APPOINTMENT_STATUS, PAYMENT_METHODS, APPOINTMENT_STATUS_CONFIG, PAYMENT_METHOD_CONFIG, MOCK_SERVICES, MOCK_BARBERS, MOCK_CLIENTS, default as agendaFinanceiro } from './agendaFinanceiro';
