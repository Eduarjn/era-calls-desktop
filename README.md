# ERA · Inteligência de Calls — App Desktop (Electron)

App instalável que abre o painel (hospedado) numa janela própria, com
**gravação nativa** (microfone + áudio do sistema via loopback), bandeja e
início automático com o Windows.

## Desenvolver
```powershell
cd desktop
npm install
npm start          # abre o app em modo desenvolvimento
```

## Gerar o instalador (.exe)
```powershell
npm run dist
```
O instalador sai em `desktop\dist\` (ex.: `ERA Inteligencia de Calls Setup 1.0.0.exe`).

## Versões / atualizações
- Suba a versão em `package.json` ("version") a cada release.
- (Próxima fase) Auto-update via GitHub Releases com `electron-updater`.

## Notas
- A tela carrega `https://eduarjn.github.io/era-calls-web/` — mudanças no painel
  saem na hora, sem reinstalar o app.
- O backend (Supabase + Groq) é o mesmo da versão web.
- Aviso do Windows SmartScreen aparece até o app ser **assinado** (certificado de
  código, pago) — por enquanto: "Mais informações → Executar assim mesmo".
