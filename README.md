# 🈶 Manga Translator

Extensão para navegador que traduz imagens de mangás, manhwas e manhuas em tempo real. Selecione a área de um balão de fala e receba a tradução em **Português (PT-BR)** diretamente sobre a imagem.

![Java](https://img.shields.io/badge/Java-17-orange?logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.5-brightgreen?logo=springboot)
![Google Cloud Vision](https://img.shields.io/badge/Google%20Cloud-Vision%20API-4285F4?logo=googlecloud)
![DeepL](https://img.shields.io/badge/DeepL-API%20Free-0F2B46?logo=deepl)
![Chrome Extension](https://img.shields.io/badge/Chrome-Manifest%20V3-blue?logo=googlechrome)

---

## 📖 Sobre o Projeto

O **Manga Translator** resolve um problema comum para leitores de mangás, manhwas e manhuas: a barreira do idioma. Muitas obras ainda não possuem tradução oficial ou estão disponíveis apenas em japonês, coreano ou chinês.

Com esta ferramenta, basta clicar no ícone da extensão, selecionar o balão de texto desejado e a tradução aparece instantaneamente sobre a imagem original.

### Como funciona

```
Usuário seleciona área → Screenshot da região → Envio ao Backend (Base64)
    → OCR (Google Vision) extrai o texto → DeepL traduz para PT-BR
        → Tradução exibida sobre o balão original
```

---

## 🚀 Tecnologias Utilizadas

### Backend
| Tecnologia | Finalidade |
|---|---|
| **Java 17** | Linguagem principal do backend |
| **Spring Boot 3.2.5** | Framework para a API REST |
| **Google Cloud Vision API** | OCR — extração de texto das imagens |
| **DeepL API (Free Tier)** | Tradução automática para PT-BR |
| **Lombok** | Redução de boilerplate no código Java |
| **Maven** | Gerenciamento de dependências e build |

### Frontend (Extensão Chrome)
| Tecnologia | Finalidade |
|---|---|
| **JavaScript (Vanilla)** | Lógica da extensão (content script e service worker) |
| **Chrome Extensions API (Manifest V3)** | Integração com o navegador |
| **Canvas API** | Recorte da área selecionada pelo usuário |
| **chrome.tabs.captureVisibleTab** | Captura de screenshot sem restrição de CORS |

---

## 🌐 Idiomas Suportados

O OCR e a tradução suportam os principais idiomas de mangás e quadrinhos asiáticos:

- 🇯🇵 **Japonês** (Mangá)
- 🇰🇷 **Coreano** (Manhwa)
- 🇨🇳 **Chinês** (Manhua)

A detecção do idioma de origem é **automática** — basta selecionar o texto e o sistema identifica e traduz.

---
