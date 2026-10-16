# 📱 Como Instalar ou Gerar APK Android para: NebulaDropsFusionCore

## Opção 1: Instalação Instantânea no Celular (Sem Loja)
1. Abra o jogo no navegador do celular (Chrome ou Samsung Internet).
2. Toque no menu (3 pontinhos) e selecione **"Adicionar à Tela Inicial"** ou **"Instalar Aplicativo"**.
3. O jogo será instalado como um App nativo de tela cheia sem barras de navegação!

## Opção 2: Gerar APK com PWABuilder (100% Gratuito)
1. Acesse https://www.pwabuilder.com
2. Digite o link público do jogo (ex: `https://agent.kinomuse.com.br/play/NebulaDropsFusionCore/`).
3. Clique em **"Build My PWA"** e selecione **Android (APK / AAB)**.
4. Baixe o pacote .APK para instalar direto no celular ou o pacote .AAB para publicar na Google Play Store!

## Opção 3: Empacotamento via Capacitor / Cordova
1. Instale o Capacitor: `npm install @capacitor/core @capacitor/cli @capacitor/android`
2. Execute `npx cap init NebulaDropsFusionCore com.glx.nebuladropsfusioncore`
3. Execute `npx cap add android` e `npx cap open android` para compilar o APK no Android Studio.
