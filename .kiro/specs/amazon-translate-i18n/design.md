# Design Document: Amazon Translate i18n Integration

## Overview

This design implements a scalable, cost-efficient internationalization (i18n) system using Amazon Translate. The architecture prioritizes three main languages (Spanish, Portuguese, German) initially, with a modular approach to support additional languages (French, Korean, Vietnamese, Thai, Mandarin Chinese) without architectural changes.

**Key Design Principles:**
- Multi-layer caching to minimize API calls and costs ($15 per million characters)
- Batch processing for efficiency (up to 100 items per request)
- Language variant support (pt-BR/pt-PT, es-MX/es-ES)
- Graceful degradation with English fallback
- Real-time language detection and user preference persistence

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Web Application                          │
│  (React/Vue/Angular with i18n middleware)                   │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼──────────┐    ┌────────▼──────────┐
│ Language         │    │ Translation       │
│ Detector         │    │ Request Handler   │
│ (Browser/User)   │    │                   │
└───────┬──────────┘    └────────┬──────────┘
        │                        │
        └────────────┬───────────┘
                     │
        ┌────────────▼────────────┐
        │  Cache Layer            │
        │  (L1: Memory)           │
        │  (L2: DynamoDB)         │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │  Batch Translator       │
        │  (Groups up to 100)     │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │  Amazon Translate API   │
        │  (Real-time service)    │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │  Quality Monitor &      │
        │  Error Handler          │
        └────────────────────────┘
```

## Components and Interfaces

### 1. Language Detector

**Purpose:** Identify user's preferred language from multiple sources

**Interface:**
```typescript
interface LanguageDetector {
  detectLanguage(): Promise<LanguageCode>;
  getUserPreference(): LanguageCode | null;
  setUserPreference(lang: LanguageCode): void;
  getSupportedLanguages(): LanguageCode[];
}
```

**Implementation Details:**
- Check browser Accept-Language header
- Query localStorage for user preference
- Fall back to English if unsupported
- Supported codes: en, es, pt, de, fr, ko, vi, th, zh

### 2. Translation Cache Manager

**Purpose:** Multi-layer caching to reduce API calls

**Cache Strategy:**
- **L1 Cache (Memory):** In-process cache for hot translations (TTL: 1 hour)
- **L2 Cache (DynamoDB):** Persistent cache across application restarts (TTL: 30 days)

**Cache Key Structure:**
```
{contentHash}#{targetLanguage}#{variant}
Example: abc123def456#es#es-MX
```

**Interface:**
```typescript
interface CacheManager {
  get(contentHash: string, language: LanguageCode, variant?: string): Promise<string | null>;
  set(contentHash: string, language: LanguageCode, translation: string, variant?: string): Promise<void>;
  invalidate(contentHash: string): Promise<void>;
  getStats(): CacheStats;
}

interface CacheStats {
  hitRate: number;
  size: number;
  evictions: number;
}
```

**DynamoDB Schema:**
```
Table: TranslationCache
- PK: contentHash (String)
- SK: languageVariant (String) [e.g., "es#es-MX"]
- translation (String)
- createdAt (Number)
- accessCount (Number)
- lastAccessed (Number)
- ttl (Number) [Unix timestamp for auto-expiration]
```

### 3. Batch Translator

**Purpose:** Group multiple translation requests for efficiency

**Batching Logic:**
- Collect requests up to 100 items or 5-second timeout
- Send single API call to Amazon Translate
- Map results back to original requests
- Retry failed items individually

**Interface:**
```typescript
interface BatchTranslator {
  translate(items: TranslationRequest[]): Promise<TranslationResult[]>;
  flush(): Promise<void>;
}

interface TranslationRequest {
  content: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  variant?: string;
  contentHash: string;
}

interface TranslationResult {
  contentHash: string;
  translation: string;
  confidence?: number;
  cached: boolean;
}
```

### 4. Amazon Translate Service Wrapper

**Purpose:** Encapsulate AWS SDK interactions

**Interface:**
```typescript
interface TranslateService {
  translateText(
    text: string,
    sourceLanguage: LanguageCode,
    targetLanguage: LanguageCode
  ): Promise<TranslationResponse>;
  
  translateBatch(
    items: TranslationItem[]
  ): Promise<TranslationResponse[]>;
}

interface TranslationResponse {
  translatedText: string;
  sourceLanguageCode: LanguageCode;
  targetLanguageCode: LanguageCode;
}
```

**AWS Configuration:**
- Region: us-east-1 (or closest to users)
- Authentication: IAM roles or environment variables
- Rate limiting: 100 requests/second (configurable)
- Timeout: 30 seconds per request

### 5. Content Parser

**Purpose:** Preserve formatting and placeholders during translation

**Responsibilities:**
- Extract translatable text from HTML/markup
- Preserve placeholders ({{variable}}, {0}, etc.)
- Handle language-specific tags
- Escape special characters

**Interface:**
```typescript
interface ContentParser {
  parse(content: string, format: 'text' | 'html'): ParsedContent;
  reconstruct(parsed: ParsedContent, translations: Map<string, string>): string;
}

interface ParsedContent {
  segments: TextSegment[];
  metadata: Map<string, any>;
}

interface TextSegment {
  id: string;
  text: string;
  type: 'translatable' | 'placeholder' | 'markup';
}
```

### 6. Error Handler & Fallback Manager

**Purpose:** Graceful degradation when translation fails

**Error Handling Strategy:**
1. Try cache first
2. Try Amazon Translate API
3. Return cached version if available
4. Fall back to English
5. Log error for monitoring

**Interface:**
```typescript
interface ErrorHandler {
  handleTranslationError(error: Error, context: ErrorContext): Promise<string>;
  shouldRetry(error: Error): boolean;
  getMetrics(): ErrorMetrics;
}

interface ErrorContext {
  content: string;
  targetLanguage: LanguageCode;
  attempt: number;
}

interface ErrorMetrics {
  totalErrors: number;
  errorsByType: Map<string, number>;
  lastError?: Error;
}
```

### 7. Quality Monitor

**Purpose:** Track translation quality and coverage

**Metrics Tracked:**
- Cache hit rate
- API response times
- Translation confidence scores
- Language coverage
- Cost per language

**Interface:**
```typescript
interface QualityMonitor {
  recordTranslation(result: TranslationResult, metrics: TranslationMetrics): void;
  getReport(language?: LanguageCode): QualityReport;
  flagForReview(contentHash: string, reason: string): void;
}

interface TranslationMetrics {
  responseTime: number;
  confidence: number;
  cached: boolean;
  language: LanguageCode;
}

interface QualityReport {
  cacheHitRate: number;
  avgResponseTime: number;
  languageCoverage: Map<LanguageCode, number>;
  estimatedMonthlyCost: number;
  flaggedItems: number;
}
```

## Data Models

### Language Configuration

```typescript
interface LanguageConfig {
  code: LanguageCode;
  name: string;
  nativeName: string;
  variants?: LanguageVariant[];
  enabled: boolean;
  priority: number; // 1 = highest priority (Spanish, Portuguese, German)
}

interface LanguageVariant {
  code: string; // e.g., "pt-BR", "es-MX"
  name: string;
  region: string;
}

// Supported languages
const LANGUAGES: LanguageConfig[] = [
  { code: 'en', name: 'English', nativeName: 'English', enabled: true, priority: 0 },
  { code: 'es', name: 'Spanish', nativeName: 'Español', variants: [
    { code: 'es-ES', name: 'European Spanish', region: 'ES' },
    { code: 'es-MX', name: 'Mexican Spanish', region: 'MX' }
  ], enabled: true, priority: 1 },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', variants: [
    { code: 'pt-BR', name: 'Brazilian Portuguese', region: 'BR' },
    { code: 'pt-PT', name: 'European Portuguese', region: 'PT' }
  ], enabled: true, priority: 1 },
  { code: 'de', name: 'German', nativeName: 'Deutsch', enabled: true, priority: 1 },
  { code: 'fr', name: 'French', nativeName: 'Français', enabled: true, priority: 2 },
  { code: 'ko', name: 'Korean', nativeName: '한국어', enabled: true, priority: 2 },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', enabled: true, priority: 2 },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', enabled: true, priority: 2 },
  { code: 'zh', name: 'Mandarin Chinese', nativeName: '中文', enabled: true, priority: 2 }
];
```

### Translation Request/Response

```typescript
interface TranslationRequest {
  id: string;
  content: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  variant?: string;
  contentHash: string;
  timestamp: number;
  userId?: string;
}

interface TranslationResponse {
  requestId: string;
  translatedText: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  confidence?: number;
  cached: boolean;
  responseTime: number;
  cost?: number;
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Cache Consistency

**For any** translation request with the same content, source language, and target language, retrieving the translation from cache should return the exact same result as the original translation.

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 2: Language Fallback Correctness

**For any** unsupported language code, the system should fall back to English without throwing an error, and the response should contain the original English content.

**Validates: Requirements 1.2, 7.2**

### Property 3: Batch Processing Equivalence

**For any** set of translation requests, processing them as a batch should produce identical results to processing them individually, with the same translations and confidence scores.

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 4: Placeholder Preservation

**For any** content containing placeholders ({{var}}, {0}, etc.), after translation and reconstruction, all placeholders should remain in their original positions and unchanged.

**Validates: Requirements 5.4**

### Property 5: User Preference Persistence

**For any** user language preference set in local storage, after page reload, the system should retrieve and apply the same preference without requiring re-selection.

**Validates: Requirements 1.3, 1.4**

### Property 6: Cache Key Uniqueness

**For any** two different translations (different content or different target languages), the cache keys should be different, ensuring no collision or incorrect cache hits.

**Validates: Requirements 3.1**

### Property 7: Error Recovery

**For any** failed translation request, if a cached version exists, the system should return the cached translation instead of the error, maintaining service availability.

**Validates: Requirements 7.1, 7.2**

### Property 8: Language Variant Handling

**For any** language with variants (Portuguese, Spanish), specifying a variant should result in translation appropriate to that region, and the system should not mix variants in results.

**Validates: Requirements 5.2, 5.3**

### Property 9: Cost Deduplication

**For any** set of duplicate content strings in a batch request, the system should only charge for translation once, with results reused for all duplicates.

**Validates: Requirements 6.1**

### Property 10: Configuration Consistency

**For any** language configuration change, the system should immediately reflect the change in the language selector UI without requiring application restart.

**Validates: Requirements 8.4**

## Error Handling

**Translation API Failures:**
- Retry with exponential backoff (1s, 2s, 4s, 8s max)
- Maximum 3 retry attempts
- Return cached version if available
- Fall back to English if no cache
- Log error with full context

**Cache Failures:**
- Continue to Amazon Translate if cache unavailable
- Log cache errors separately
- Alert operators if cache unavailable for >5 minutes

**Rate Limiting:**
- Implement token bucket algorithm
- Queue requests when rate limit approached
- Batch queue during off-peak hours
- Alert when approaching daily limits

**Invalid Language Codes:**
- Validate against supported languages list
- Return error with list of supported languages
- Suggest closest match if available

## Testing Strategy

### Unit Tests

**Language Detector:**
- Test browser header parsing
- Test localStorage persistence
- Test fallback to English
- Test unsupported language handling

**Cache Manager:**
- Test cache hit/miss scenarios
- Test TTL expiration
- Test LRU eviction
- Test concurrent access

**Batch Translator:**
- Test batching logic (< 100, = 100, > 100 items)
- Test timeout-based flushing
- Test result mapping
- Test individual retry on batch failure

**Content Parser:**
- Test placeholder preservation
- Test HTML escaping
- Test language-specific tags
- Test edge cases (empty content, special characters)

**Error Handler:**
- Test fallback chain (cache → API → English)
- Test retry logic
- Test error logging
- Test metrics collection

### Property-Based Tests

Each property will be tested using a property-based testing framework (fast-check for TypeScript):

**Property 1: Cache Consistency**
- Generate random content strings
- Translate and cache
- Retrieve from cache multiple times
- Assert all retrievals match original

**Property 2: Language Fallback**
- Generate invalid language codes
- Request translation
- Assert English fallback without error

**Property 3: Batch Processing Equivalence**
- Generate random translation requests
- Process as batch and individually
- Assert identical results

**Property 4: Placeholder Preservation**
- Generate content with various placeholder formats
- Translate and reconstruct
- Assert placeholders unchanged

**Property 5: User Preference Persistence**
- Set random language preference
- Simulate page reload
- Assert preference retrieved correctly

**Property 6: Cache Key Uniqueness**
- Generate pairs of different translations
- Assert cache keys are different

**Property 7: Error Recovery**
- Simulate API failure
- Assert cached version returned
- Assert no error thrown

**Property 8: Language Variant Handling**
- Generate requests with language variants
- Assert variant-appropriate translation
- Assert no variant mixing

**Property 9: Cost Deduplication**
- Generate batch with duplicates
- Assert only one API call per unique content
- Assert results reused for duplicates

**Property 10: Configuration Consistency**
- Change language configuration
- Assert UI updates immediately
- Assert no restart required

**Test Configuration:**
- Minimum 100 iterations per property
- Timeout: 5 seconds per test
- Seed: Fixed for reproducibility
- Coverage: All code paths

## Performance Considerations

**Latency Targets:**
- Cache hit: < 50ms
- Cache miss (API): < 500ms
- Batch processing: < 1s for 100 items

**Scalability:**
- Support 1M+ translations per day
- Handle 100+ concurrent users
- DynamoDB: On-demand pricing for variable load

**Cost Optimization:**
- Batch processing reduces API calls by 80-90%
- Caching reduces API calls by 60-70%
- Combined: 95%+ reduction in API calls
- Estimated cost: $0.15-0.30 per 1M characters

## Deployment Considerations

**Environment Variables:**
```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=***
AWS_SECRET_ACCESS_KEY=***
TRANSLATE_CACHE_TTL=2592000 (30 days)
TRANSLATE_BATCH_SIZE=100
TRANSLATE_BATCH_TIMEOUT=5000 (5 seconds)
TRANSLATE_RATE_LIMIT=100 (requests/second)
```

**AWS Permissions Required:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "translate:TranslateText"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/TranslationCache"
    }
  ]
}
```

**Monitoring & Alerts:**
- CloudWatch metrics for API calls
- DynamoDB metrics for cache performance
- Custom metrics for cache hit rate
- Alerts for error rate > 5%
- Alerts for API costs > threshold

