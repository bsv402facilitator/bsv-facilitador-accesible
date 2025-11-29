# AI Metadata Setup Guide

This guide walks you through setting up AI-powered metadata generation for the BSV X402 facilitator.

## Prerequisites

- OpenAI API account and API key
- Wrangler CLI installed (`npm install -g wrangler`)
- Access to Cloudflare Workers (for KV namespaces)

## Setup Steps

### 1. Create KV Namespaces

You need to create two KV namespaces: one for development and one for production.

```bash
# Create production KV namespace
wrangler kv:namespace create "METADATA_CACHE"

# Create development KV namespace (with --preview flag)
wrangler kv:namespace create "METADATA_CACHE" --preview
```

**Important:** Save the namespace IDs returned by these commands. You'll need them in step 3.

Example output:
```
✨  Success!
Add the following to your wrangler.toml:
{ binding = "METADATA_CACHE", id = "abc123def456..." }
```

### 2. Configure OpenAI API Key

Set your OpenAI API key as a secret in Cloudflare Workers:

```bash
# For development environment
wrangler secret put OPENAI_API_KEY --env development
# When prompted, paste your OpenAI API key

# For production environment
wrangler secret put OPENAI_API_KEY --env production
# When prompted, paste your OpenAI API key
```

**Security Note:** Never commit your API key to git. Always use `wrangler secret` to set it.

### 3. Update wrangler.toml

Update the `wrangler.toml` file with your actual KV namespace IDs:

```toml
# Replace these placeholder IDs with your actual KV namespace IDs from step 1

# Default KV namespace
[[kv_namespaces]]
binding = "METADATA_CACHE"
id = "your_production_kv_id_here"  # Replace with actual ID

# Development environment
[[env.development.kv_namespaces]]
binding = "METADATA_CACHE"
id = "your_dev_kv_id_here"  # Replace with actual ID

# Production environment
[[env.production.kv_namespaces]]
binding = "METADATA_CACHE"
id = "your_production_kv_id_here"  # Replace with actual ID
```

### 4. Test Locally

Run the development server to test the integration:

```bash
wrangler dev --env development
```

The AI metadata generation will now work locally. Test it by making requests to your endpoints:

```bash
curl http://localhost:8787/?language=en&cognitiveLevel=simple
```

### 5. Run Tests

Verify everything is working correctly:

```bash
# Run all tests
npm run test

# Run only AI metadata tests
npm run test -- ai-metadata
```

### 6. Deploy to Development

Deploy to your development environment first:

```bash
wrangler deploy --env development
```

### 7. Monitor and Adjust

Monitor your deployment:

```bash
wrangler tail --env development
```

Check:
- **Latency**: P95 should be < 4s
- **Cache hit rate**: Should be > 50% after 24 hours
- **Error rate**: Should be < 1%
- **Costs**: Monitor OpenAI API usage at https://platform.openai.com/usage

### 8. Gradual Rollout to Production

The implementation includes a gradual rollout mechanism via `AI_ROLLOUT_PERCENTAGE`:

**Phase 1: 20% rollout (Week 1)**
```toml
[env.production.vars]
AI_ROLLOUT_PERCENTAGE = "20"
```

Deploy and monitor for 2-3 days:
```bash
wrangler deploy --env production
```

**Phase 2: 50% rollout (Week 2)**
```toml
[env.production.vars]
AI_ROLLOUT_PERCENTAGE = "50"
```

**Phase 3: 100% rollout (Week 3)**
```toml
[env.production.vars]
AI_ROLLOUT_PERCENTAGE = "100"
```

### 9. Emergency Rollback

If you need to immediately disable AI and revert to templates:

```toml
[env.production.vars]
AI_ENABLED = "false"
```

Then redeploy:
```bash
wrangler deploy --env production
```

## Configuration Options

All configuration is in `wrangler.toml`:

### AI Feature Flags

- **AI_ENABLED**: Set to "true" to enable AI, "false" to use templates
- **AI_ROLLOUT_PERCENTAGE**: Percentage of requests to use AI (0-100)

### Model Selection

- **OPENAI_MODEL_DEFAULT**: Default model for most requests (recommended: "gpt-4o-mini")
- **OPENAI_MODEL_COMPLEX**: Model for complex scenarios (recommended: "gpt-4o-mini" or "gpt-4")

### Cache TTL

- **CACHE_TTL_GENERIC**: Cache duration for generic messages in seconds (default: 604800 = 7 days)
- **CACHE_TTL_SPECIFIC**: Cache duration for specific messages in seconds (default: 86400 = 24 hours)

## Monitoring

### View Logs

```bash
wrangler tail --env production
```

Look for:
- "Calling OpenAI API" - AI generation attempts
- "Successfully generated AI metadata" - Successful generations
- "Cache hit for AI metadata" - Cache hits
- "OpenAI generation failed, falling back to template" - Fallback events

### Check KV Cache

```bash
# List cached items
wrangler kv:key list --binding METADATA_CACHE --env production

# Get a specific cached item
wrangler kv:key get "ai-meta:es:simple:success.verifyValid:generic" --binding METADATA_CACHE --env production
```

### Monitor Costs

1. Go to https://platform.openai.com/usage
2. Check daily token usage
3. With 70% cache hit rate, expect $5-10/month for moderate traffic

## Troubleshooting

### AI not working, always using templates

Check:
1. `AI_ENABLED` is set to "true" in wrangler.toml
2. `AI_ROLLOUT_PERCENTAGE` is > 0
3. `OPENAI_API_KEY` secret is set correctly
4. View logs with `wrangler tail` to see errors

### High costs

Solutions:
1. Increase cache TTL values
2. Reduce `AI_ROLLOUT_PERCENTAGE`
3. Use cheaper models (gpt-3.5-turbo for English)
4. Check cache hit rate - should be > 60%

### Slow response times

Solutions:
1. Reduce OPENAI_TIMEOUT (default: 5000ms)
2. Use faster models
3. Increase cache TTL to improve hit rate

### Cache not working

Check:
1. KV namespace IDs are correct in wrangler.toml
2. KV namespace is bound correctly
3. View KV contents with `wrangler kv:key list`

## Architecture Overview

```
Request → Feature Flag Check → Cache Lookup
                                    ↓
                            Cache Hit? ─Yes→ Return Cached
                                    ↓
                                    No
                                    ↓
                              OpenAI API Call
                                    ↓
                            Success? ─Yes→ Cache & Return
                                    ↓
                                    No
                                    ↓
                              Template Fallback
```

## Performance Expectations

- **P95 Latency**: < 4s (including OpenAI call)
- **Cache Hit Rate**: 60-80% after 24 hours
- **Error Rate**: < 1%
- **Cost**: $5-15/month with moderate traffic and caching

## Security Best Practices

1. **Never commit secrets**: Always use `wrangler secret put`
2. **Rotate API keys**: Periodically rotate your OpenAI API key
3. **Monitor usage**: Set up alerts for unusual API usage
4. **Rate limiting**: Consider implementing rate limiting if needed

## Next Steps

- Monitor performance metrics
- Adjust model selection based on cost/quality tradeoff
- Fine-tune cache TTL based on traffic patterns
- Collect user feedback on AI-generated metadata quality

## Support

For issues or questions:
- Check logs with `wrangler tail`
- Review the implementation plan: `docs/AI-METADATA-IMPLEMENTATION-PLAN.md`
- Test locally with `wrangler dev`
- Review tests: `tests/unit/accessibility/ai-metadata.test.ts`
