package com.mangatranslator.controller;

import com.mangatranslator.dto.TranslationRequest;
import com.mangatranslator.dto.TranslationResponse;
import com.mangatranslator.service.OcrService;
import com.mangatranslator.service.TranslationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Base64;

@Slf4j
@RestController
@RequestMapping("/api/manga")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class MangaTranslatorController {

    private final OcrService ocrService;
    private final TranslationService translationService;

    @PostMapping("/translate")
    public ResponseEntity<TranslationResponse> translate(@RequestBody TranslationRequest request) {

        // 1. Validação: verifica se o Base64 foi enviado
        if (request.getImageBase64() == null || request.getImageBase64().isBlank()) {
            log.warn("Requisição recebida sem imagem Base64.");
            return ResponseEntity.badRequest()
                    .body(new TranslationResponse("Erro: imagem Base64 não foi enviada."));
        }

        // 2. Remove o prefixo "data:image/png;base64," se presente
        String base64Clean = request.getImageBase64();
        if (base64Clean.contains(",")) {
            base64Clean = base64Clean.split(",")[1];
        }

        // 3. Valida o Base64
        byte[] imageBytes;
        try {
            imageBytes = Base64.getDecoder().decode(base64Clean);
            double sizeKB = imageBytes.length / 1024.0;
            log.info("Imagem recebida com sucesso! Tamanho: {} KB", String.format("%.2f", sizeKB));
        } catch (IllegalArgumentException e) {
            log.error("Base64 inválido recebido.", e);
            return ResponseEntity.badRequest()
                    .body(new TranslationResponse("Erro: o Base64 enviado é inválido."));
        }

        try {
            // 4. OCR: Extrai o texto da imagem (japonês, coreano, chinês)
            log.info("Iniciando OCR...");
            String extractedText = ocrService.extract(base64Clean);

            if (extractedText == null || extractedText.isBlank()) {
                log.warn("OCR não encontrou texto na imagem.");
                return ResponseEntity.ok(
                        new TranslationResponse("Nenhum texto foi encontrado na imagem."));
            }

            log.info("Texto extraído: {}", extractedText);

            // 5. Tradução: Traduz o texto para PT-BR via DeepL
            log.info("Iniciando tradução...");
            String translatedText = translationService.translate(extractedText);

            log.info("Tradução concluída: {}", translatedText);
            return ResponseEntity.ok(new TranslationResponse(translatedText));

        } catch (Exception e) {
            log.error("Erro durante processamento: ", e);
            return ResponseEntity.internalServerError()
                    .body(new TranslationResponse("Erro interno: " + e.getMessage()));
        }
    }
}
