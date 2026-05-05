# Live Translator Hub

> Cursor ve Claude masaüstü uygulamaları için GUI destekli gerçek zamanlı yerelleştirme motoru — Webview eklenti penetrasyonu ve AI destekli asenkron çeviri ile.

[English](../../README.md) | [中文](zh-CN.md) | [日本語](ja-JP.md) | [한국어](ko-KR.md) | [Français](fr-FR.md) | [Deutsch](de-DE.md) | [Español](es-ES.md) | [Italiano](it-IT.md) | [Português](pt-BR.md) | [Português](pt-PT.md) | [Nederlands](nl-NL.md) | [Polski](pl-PL.md) | [Svenska](sv-SE.md) | [Dansk](da-DK.md) | [Suomi](fi-FI.md) | [Norsk](nb-NO.md) | [Čeština](cs-CZ.md) | [Slovenčina](sk-SK.md) | [Română](ro-RO.md) | [Magyar](hu-HU.md) | [Ελληνικά](el-GR.md) | [Български](bg-BG.md) | [Українська](uk-UA.md) | [Русский](ru-RU.md) | [Lietuvių](lt-LT.md) | [Latviešu](lv-LV.md) | [Eesti](et-EE.md) | [Tiếng Việt](vi-VN.md) | [ไทย](th-TH.md) | [Bahasa Indonesia](id-ID.md) | [Bahasa Melayu](ms-MY.md) | [हिन्दी](hi-IN.md)

## Proje Genel Bakış

Live Translator Hub, **Electron + React GUI masaüstü uygulaması** olup, Cursor ve Claude adlı iki AI programlama aracına tek tıkla Çince çeviri (Hanlaştırma) sağlar. Birleşik bir çeviri çalışma zamanı çekirdeği aracılığıyla, tek bir arayüzde iki hedef uygulamanın motor dağıtımını, API anahtar yapılandırmasını ve sözlük oluşturmayı yönetir.

Bu proje, [Live-Translator-Hub](https://github.com/Uncle-Gao/Live-Translator-Hub)'un mimari yükseltmesidir – CLI betiğinden durum paneli ve gerçek zamanlı günlük içeren bir GUI'ye evrilmiş ve Cursor ile Claude'un Hanlaştırma yeteneklerini tek bir birleşik platformda toplamıştır.

![Ekran Görüntüsü](../../image.png)
![Ekran Görüntüsü](../../image-1.png)

## Mimari

```
live-translator-ecosystem/          # npm workspaces monorepo
├── packages/
│   ├── desktop-app/                # Electron + React GUI (Live Translator Hub)
│   │   ├── electron/main.js        # Ana süreç, IPC kanalları ve yapılandırma kalıcılığı
│   │   ├── electron/preload.js     # Oluşturma süreci iletişim köprüsü
│   │   └── src/                    # React 19 + Tailwind v4 + Zustand
│   ├── core/                       # Çeviri çalışma zamanı çekirdeği (translator-engine.js)
│   ├── patcher-cursor/             # Cursor uygulama yamalayıcısı
│   ├── patcher-claude/             # Claude uygulama yamalayıcısı
│   └── dict-generator/             # AI sözlük oluşturucu
```

### Çeviri Çalışma Zamanı

`packages/core/src/translator-engine.js`, hedef uygulamaya enjekte edilen tek çalışma zamanıdır – saf tarayıcı JavaScript'i, modül bağımlılığı yoktur. Sorumlulukları şunları içerir:

- **Sözlük Eşleştirme**: Statik girişler + regex desenleri
- **AI Çeviri Vekil Köprüsü**: Webview ortamında, `postMessage` aracılığıyla çeviri isteklerini ana pencereye iletir, CSP ağ kısıtlamalarını aşar
- **Çeviri Önbelleği**: `localStorage` tabanlı kalıcı önbellek, anahtar adı `live_i18n_cache_<entity_name>`
- **İç İçe Sözlük Arama**: `enableNestedDict` modunu destekler

## Öne Çıkan Özellikler

### Çift Motorun Birleşik Yönetimi

Tek bir arayüzde Cursor ve Claude'un Hanlaştırma dağıtım durumunu, sözlük sürümünü ve engelleme kurallarını ayrı ayrı yönetin, araç değiştirmeye gerek kalmaz.

### Her Senaryoda Webview Geçişi

Translation Bridge mimarisi sayesinde, AI çeviri yeteneği ana pencereden tüm katmanlardaki Webview eklentilerine (Claude Code gibi) nüfuz edebilir, katı CSP politikaları altındaki ağ engelleme sorununu çözer.

### Dört Panelli Fonksiyon Düzeni

| Panel | Fonksiyon |
| :--- | :--- |
| **Cursor Engine** | Cursor Hanlaştırmasını dağıt/geri al, ana pencere ve Webview eklentileri için alan bazlı engelleme kurallarını yönet |
| **Claude Engine** | Claude Hanlaştırmasını dağıt/geri al, atlama kurallarını yapılandır |
| **API Keys** | Birden fazla AI çeviri motorunun API anahtarlarını yönet (OpenAI, Anthropic, Google Gemini, DeepL desteklenir), anahtarlar Electron `safeStorage` ile şifrelenmiş olarak saklanır |
| **Dict Generator** | Hedef uygulama kaynak kodundan UI dizelerini çıkar, AI ile toplu çeviri sözlüğü oluştur |

### Etkileşimli Hata Ayıklama

- `Cmd + Option + Shift + B` (Mac) / `Ctrl + Alt + Shift + B` (Win) ile mavi kesikli vurgu çerçevesini aç/kapat
- Vurgu modunda `Option` (Mac) / `Alt` (Win) tuşuna basılı tutup Çince metnin üzerine gelerek orijinal metni görüntüle

### Alan Bazlı Engelleme Kuralları

Her varlık (ana pencere ve her bir eklenti) tamamen bağımsız engelleme kuralı setlerine sahiptir (CSS seçiciler, URL eşleştirme, başlık eşleştirme), böylece kod alanı ve temel etkileşim bölgelerinin çeviriden etkilenmemesi sağlanır.

### Otomatik Güncelleme

Dahili `electron-updater` ile macOS uygulama içi otomatik kontrol, indirme ve güncelleme kurulumu desteklenir.

## Hızlı Başlangıç

```bash
# Bağımlılıkları yükle
npm install

# GUI geliştirme modunu başlat
npm run dev

# macOS dağıtılabilir sürümü oluştur
npm run build -w desktop-app
```

### Kullanım Akışı

1. **API Keys** panelinde AI motor anahtarlarını yapılandır
2. **Cursor Engine** veya **Claude Engine** paneline geç
3. **Deploy** düğmesine tıklayarak Hanlaştırmayı tek tıkla dağıt
4. Hedef uygulamayı yeniden başlatarak değişiklikleri etkinleştir

### Sistem Gereksinimleri

- macOS 13+ (önerilir)
- Node.js 18+
- Cursor veya Claude masaüstü uygulaması yüklü olmalı

## Güvenlik

- **API Anahtarlarının Şifrelenmiş Saklanması**: Electron `safeStorage` ile `~/.live_translator_hub/api_keys.enc` dosyasına şifrelenerek kaydedilir, yapılandırma dosyasına yazılmaz
- **Doğrudan İletişim**: Çeviri istekleri doğrudan AI sağlayıcı API'sine gider, aracı sunucu yoktur
- **Alan İzolasyonu**: Engelleme kuralları kaynak kod dosyalarına dokunmaz

---

*Bu proje yalnızca öğrenme ve paylaşım amaçlıdır. Çeviri kalitesi seçilen AI modeline bağlıdır.*
