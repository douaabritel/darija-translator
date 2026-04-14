package ma.translator.model;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Response model for translation endpoint.
 */
public class TranslationResponse {

    @JsonProperty("originalText")
    private String originalText;

    @JsonProperty("translatedText")
    private String translatedText;

    @JsonProperty("sourceLanguage")
    private String sourceLanguage;

    @JsonProperty("targetLanguage")
    private String targetLanguage = "Darija (Moroccan Arabic)";

    @JsonProperty("success")
    private boolean success;

    @JsonProperty("errorMessage")
    private String errorMessage;

    public TranslationResponse() {}

    // Success factory
    public static TranslationResponse success(String original, String translated, String sourceLang) {
        TranslationResponse r = new TranslationResponse();
        r.originalText = original;
        r.translatedText = translated;
        r.sourceLanguage = sourceLang;
        r.success = true;
        return r;
    }

    // Error factory
    public static TranslationResponse error(String errorMessage) {
        TranslationResponse r = new TranslationResponse();
        r.success = false;
        r.errorMessage = errorMessage;
        return r;
    }

    public String getOriginalText() { return originalText; }
    public void setOriginalText(String originalText) { this.originalText = originalText; }

    public String getTranslatedText() { return translatedText; }
    public void setTranslatedText(String translatedText) { this.translatedText = translatedText; }

    public String getSourceLanguage() { return sourceLanguage; }
    public void setSourceLanguage(String sourceLanguage) { this.sourceLanguage = sourceLanguage; }

    public String getTargetLanguage() { return targetLanguage; }
    public void setTargetLanguage(String targetLanguage) { this.targetLanguage = targetLanguage; }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
}
