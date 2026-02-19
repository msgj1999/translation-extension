package com.mangatranslator.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
public class TranslationService {

    @Value("${deepl.api.key}")
    private String deeplApiKey;

    @Value("${deepl.api.url}")
    private String deeplApiUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public String translate(String sourceText) {

        if (sourceText == null || sourceText.isBlank()) {
            log.warn("Texto de origem vazio, nada para traduzir.");
            return "";
        }

        try {
            // 1. Monta os headers com autenticação via Header
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "DeepL-Auth-Key " + deeplApiKey);

            // 2. Monta o body como JSON
            String jsonBody = objectMapper.writeValueAsString(
                    java.util.Map.of(
                            "text", java.util.List.of(sourceText),
                            "target_lang", "PT-BR"
                    )
            );

            HttpEntity<String> request = new HttpEntity<>(jsonBody, headers);

            // 3. Faz o POST para a API do DeepL
            log.info("Enviando texto para tradução no DeepL ({} caracteres)...", sourceText.length());

            ResponseEntity<String> response = restTemplate.exchange(
                    deeplApiUrl,
                    HttpMethod.POST,
                    request,
                    String.class
            );

            // 4. Extrai o texto traduzido do JSON de resposta
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode translations = root.get("translations");

            if (translations != null && translations.isArray() && translations.size() > 0) {
                String translatedText = translations.get(0).get("text").asText();
                String detectedLang = translations.get(0).get("detected_source_language").asText();

                log.info("Idioma detectado: {} | Texto traduzido: {}", detectedLang, translatedText);
                return translatedText;
            }

            log.warn("Resposta do DeepL não contém traduções.");
            return "Erro: resposta inesperada do DeepL.";

        } catch (Exception e) {
            log.error("Erro ao traduzir texto: ", e);
            throw new RuntimeException("Falha na tradução: " + e.getMessage(), e);
        }
    }
}
