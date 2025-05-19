# AICommit API Integration Updates

## Summary of Changes

This update replaces the text-based commit message generation with a local JSON API server integration. The changes include:

1. Implemented HTTP-based API calls to a local server for commit message generation
2. Added interfaces for parsing JSON responses (CommitMessageResponse and CommitContent)
3. Updated the prompt template to request a JSON response
4. Added proper error handling for API calls and JSON parsing
5. Removed obsolete text formatting logic
6. Added documentation for API integration
7. Created a test script for verifying API functionality

## Benefits

- More structured and consistent commit messages
- API-based approach allows using any LLM server that implements the OpenAI chat API format
- Direct JSON parsing eliminates the need for text extraction logic
- Emojis are now provided by the API, removing the need for client-side emoji enhancement

## Testing

To test the API integration:

1. Make sure your API server is running at the configured endpoint (default: http://192.168.1.2:1234)
2. Run the test script with `node scripts/test-api.js`
3. Check the console output for the API response and formatted commit message

## Configuration

The API endpoint is currently hardcoded in `src/frameworks/default-ai/default-ai-repository-impl.ts` as:

```typescript
private apiUrl = 'http://192.168.1.2:1234';
```

You may need to modify this to match your local server configuration.

## Next Steps

1. Add configuration options for the API endpoint through environment variables or a config file
2. Implement fallback handling for API failures
3. Add more comprehensive error reporting for API issues
4. Create a simple API server implementation for users who don't have one
