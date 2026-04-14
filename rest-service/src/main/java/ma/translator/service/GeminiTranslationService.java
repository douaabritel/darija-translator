package ma.translator.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.cert.X509Certificate;

/**
 * {@link TranslationService} implementation that delegates to the Google Gemini API.
 *
 * <p>The API key is resolved in order:
 * <ol>
 *   <li>Environment variable {@code GEMINI_API_KEY}</li>
 *   <li>JVM system property {@code gemini.api.key}</li>
 * </ol>
 */
public class GeminiTranslationService implements TranslationService {

    private static final Logger logger = LoggerFactory.getLogger(GeminiTranslationService.class);

    private static final String API_KEY = System.getenv().getOrDefault(
            "GEMINI_API_KEY",
            System.getProperty("gemini.api.key", ""));

    private static final String GEMINI_API_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + API_KEY;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = buildHttpClient();

    /**
     * Builds an {@link HttpClient} with a permissive SSL context to handle
     * GlassFish's custom trust store on macOS.
     */
    private static HttpClient buildHttpClient() {
        try {
            SSLContext sslContext = SSLContext.getInstance("TLS");
            sslContext.init(null, new TrustManager[]{new X509TrustManager() {
                public void checkClientTrusted(X509Certificate[] chain, String authType) {}
                public void checkServerTrusted(X509Certificate[] chain, String authType) {}
                public X509Certificate[] getAcceptedIssuers() { return new X509Certificate[0]; }
            }}, null);
            return HttpClient.newBuilder().sslContext(sslContext).build();
        } catch (Exception e) {
            return HttpClient.newHttpClient();
        }
    }

    @Override
    public String translate(String text, String sourceLanguage) throws TranslationException {
        if (text == null || text.isBlank()) {
            throw new TranslationException("Input text cannot be empty.");
        }

        String requestBody = buildRequestBody(buildPrompt(text, sourceLanguage));
        logger.info("Sending translation request for text: [{}]", text.substring(0, Math.min(50, text.length())));

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(GEMINI_API_URL))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));

            if (response.statusCode() != 200) {
                logger.error("Gemini API error {}: {}", response.statusCode(), response.body());
                throw new TranslationException("Gemini API returned status: " + response.statusCode());
            }

            return parseGeminiResponse(response.body());
        } catch (TranslationException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Failed to call Gemini API", e);
            throw new TranslationException("Failed to connect to translation service: " + e.getMessage());
        }
    }

    private String buildPrompt(String text, String sourceLanguage) {
        return String.format(
                "You are an expert translator specializing in Moroccan Arabic Dialect (Darija). " +
                "Translate the following %s text to Moroccan Arabic Dialect (Darija). " +
                "Use authentic Moroccan Darija vocabulary and expressions. " +
                "Return ONLY the translation without any explanation or additional text.\n\n" +
                "Text to translate: %s",
                sourceLanguage, text);
    }

    private String buildRequestBody(String prompt) throws TranslationException {
        try {
            ObjectNode root = objectMapper.createObjectNode();
            ArrayNode contents = root.putArray("contents");
            ArrayNode parts = contents.addObject().putArray("parts");
            parts.addObject().put("text", prompt);

            ObjectNode genConfig = root.putObject("generationConfig");
            genConfig.put("temperature", 0.3);
            genConfig.put("maxOutputTokens", 1024);

            return objectMapper.writeValueAsString(root);
        } catch (Exception e) {
            throw new TranslationException("Failed to build request body: " + e.getMessage(), e);
        }
    }

    private String parseGeminiResponse(String responseBody) throws TranslationException {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && !candidates.isEmpty()) {
                JsonNode text = candidates.get(0).path("content").path("parts").get(0).path("text");
                if (!text.isMissingNode()) {
                    return text.asText().trim();
                }
            }
            throw new TranslationException("Unexpected response structure from Gemini API.");
        } catch (TranslationException e) {
            throw e;
        } catch (Exception e) {
            throw new TranslationException("Failed to parse Gemini response: " + e.getMessage());
        }
    }
}
