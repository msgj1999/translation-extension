package com.mangatranslator.service;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.vision.v1.*;
import com.google.protobuf.ByteString;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Base64;
import java.util.List;

@Slf4j
@Service
public class OcrService {

    public String extract(String imageBase64) {
        try {
            // 1. Decodifica o Base64 para bytes
            byte[] imageBytes = Base64.getDecoder().decode(imageBase64);
            ByteString imgBytes = ByteString.copyFrom(imageBytes);

            // 2. Monta a imagem e o tipo de detecção
            Image image = Image.newBuilder()
                    .setContent(imgBytes)
                    .build();

            // DOCUMENT_TEXT_DETECTION é melhor para textos densos (balões de mangá)
            Feature feature = Feature.newBuilder()
                    .setType(Feature.Type.DOCUMENT_TEXT_DETECTION)
                    .build();

            AnnotateImageRequest request = AnnotateImageRequest.newBuilder()
                    .addFeatures(feature)
                    .setImage(image)
                    .build();

            // 3. Carrega as credenciais do arquivo JSON explicitamente
            GoogleCredentials credentials = GoogleCredentials.fromStream(
                    getClass().getClassLoader().getResourceAsStream("google-credentials.json")
            );

            ImageAnnotatorSettings settings = ImageAnnotatorSettings.newBuilder()
                    .setCredentialsProvider(() -> credentials)
                    .build();

            // 4. Envia para a API do Google Vision
            try (ImageAnnotatorClient client = ImageAnnotatorClient.create(settings)) {

                BatchAnnotateImagesResponse response = client.batchAnnotateImages(
                        List.of(request)
                );

                AnnotateImageResponse imageResponse = response.getResponsesList().get(0);

                // Verifica se houve erro na resposta
                if (imageResponse.hasError()) {
                    log.error("Erro do Google Vision: {}", imageResponse.getError().getMessage());
                    throw new RuntimeException("Erro no OCR: " + imageResponse.getError().getMessage());
                }

                // 5. Extrai o texto completo
                String extractedText = imageResponse.getFullTextAnnotation().getText();
                log.info("Texto extraído pelo OCR: {}", extractedText);

                return extractedText;
            }

        } catch (Exception e) {
            log.error("Erro ao processar OCR: ", e);
            throw new RuntimeException("Falha ao extrair texto da imagem: " + e.getMessage(), e);
        }
    }
}
