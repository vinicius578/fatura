# Faturas Família (offline)

App 100% offline: sem login, sem internet, sem Supabase. Os dados ficam salvos em cada celular.

## Como gerar o APK (grátis, sem instalar nada no PC)
1. Crie uma conta em https://github.com e um repositório novo (privado serve).
2. Envie TODOS os arquivos desta pasta para o repositório (inclusive a pasta `.github`).
3. Abra a aba **Actions** > **Gerar APK** > **Run workflow**. Aguarde uns 5 a 8 minutos.
4. Abra a execução concluída, role até **Artifacts** e baixe `faturas-familia-apk` (zip com o `app-debug.apk`).
5. Mande o `.apk` pelo WhatsApp para a família.

## Instalar no Android
Abra o `.apk` > permita "instalar apps desconhecidos" para o app usado (WhatsApp/Arquivos) > Instalar.

## Importante
- Cada celular tem seus próprios dados (não sincronizam entre si).
- Use **Backup > Copiar backup** para guardar os dados e **Restaurar backup** para recuperar (ex.: trocar de celular).
- Desinstalar o app apaga os dados: faça backup antes.

## iPhone (instalar pelo Safari, funciona offline)
1. No repositório: **Settings > Pages > Source: GitHub Actions**.
2. Em **Actions**, rode **Publicar versão iPhone**. Ao terminar, o link aparece (algo como `https://seuusuario.github.io/nome-do-repositorio/`).
3. Abra o link no **Safari** do iPhone, toque em Compartilhar > **Adicionar à Tela de Início**.
4. Abra uma vez com internet; depois disso funciona sem internet.
