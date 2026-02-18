package com.mangatranslator.controller;

import com.mangatranslator.dto.TranslationRequest;
import com.mangatranslator.dto.TranslationResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Base64;

@Slf4j
@RestController
@RequestMapping("/api/manga")
@CrossOrigin(origins = "*")
public class MangaTranslatorController {

    @PostMapping("/translate")
    public ResponseEntity<TranslationResponse> translate(@RequestBody TranslationRequest request) {

        if (request.getImageBase64() == null || request.getImageBase64().isBlank()) {
            log.warn("Requisição recebida sem imagem Base64.");
            return ResponseEntity.badRequest()
                    .body(new TranslationResponse("Erro: imagem Base64 não foi enviada."));
        }

        String base64Clean = request.getImageBase64();
        if (base64Clean.contains(",")) {
            base64Clean = base64Clean.split(",")[1];
        }

        try {
            byte[] imageBytes = Base64.getDecoder().decode(base64Clean);
            double sizeKB = imageBytes.length / 1024.0;
            log.info("Imagem recebida com sucesso! Tamanho: {} KB", String.format("%.2f", sizeKB));
        } catch (IllegalArgumentException e) {
            log.error("Base64 inválido recebido.", e);
            return ResponseEntity.badRequest()
                    .body(new TranslationResponse("Erro: o Base64 enviado é inválido."));
        }

        // ---------------------------------------------------------------
        // MOCK: No Passo 2, aqui entrarão as chamadas reais:
        //   String textoExtraido = ocrService.extract(base64Clean);
        //   String textoTraduzido = translationService.translate(textoExtraido);
        // ---------------------------------------------------------------

        String respostaMock = "Tradução de teste — Seu backend está funcionando!";

        log.info("Resposta mockada enviada: {}", respostaMock);
        return ResponseEntity.ok(new TranslationResponse(respostaMock));
    }
}
