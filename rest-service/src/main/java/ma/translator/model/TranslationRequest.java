package ma.translator.model;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Request model for translation endpoint.
 */
public class TranslationRequest {

    @JsonProperty("text")
    private String text;

    @JsonProperty("sourceLanguage")
    private String sourceLanguage = "English";

    public TranslationRequest() {}

    public TranslationRequest(String text) {
        this.text = text;
    }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public String getSourceLanguage() { return sourceLanguage; }
    public void setSourceLanguage(String sourceLanguage) { this.sourceLanguage = sourceLanguage; }
}
