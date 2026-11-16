# Brasil Imersivo — Realidade Virtual Geo

Experiência educativa para explorar os **seis biomas brasileiros** por meio de ambientes 3D, panoramas em 360°, conteúdos de Geografia e vídeos de fauna.

**Acesse o projeto:** https://brenner279.github.io/realidadevirtual/

## Experiência

- Exploração dos seis biomas: Amazônia, Cerrado, Caatinga, Mata Atlântica, Pantanal e Pampa.
- Ambientes 3D com A-Frame.
- Panoramas fotográficos em 360°.
- Conteúdos educativos e pontos interativos.
- Vídeos 360° de fauna.
- Interface para computador e celular.
- Entrada em realidade virtual quando o navegador e o dispositivo oferecem suporte.

## Usar totalmente offline no Chrome

A experiência pode ser preparada uma vez e depois utilizada sem internet pelo mesmo navegador:

1. Abra o endereço do GitHub Pages no Chrome enquanto estiver conectado à internet.
2. Na página inicial, toque em **Preparar versão offline**.
3. Aguarde o contador chegar a **37 de 37**. O download inclui cerca de 180 MB de panoramas, vídeos, imagens e recursos.
4. Depois de concluir, desligue Wi-Fi e dados móveis e recarregue o mesmo endereço no Chrome.
5. Explore os biomas, abra as imagens informativas e reproduza os vídeos de Fauna VR sem conexão.

**Importante:** o primeiro carregamento e a preparação dos arquivos exigem internet. O modo offline usa Service Worker e Cache API, por isso não funciona abrindo o arquivo HTML diretamente por `file://`. Acesse pelo endereço HTTPS do GitHub Pages e use o mesmo Chrome em que os arquivos foram preparados. Não use janela anônima e não limpe os dados do site depois do download.

O armazenamento necessário é de aproximadamente 180 MB; recomendamos deixar pelo menos 210 MB livres no Chrome/aparelho. A preservação do cache depende das regras de armazenamento do navegador e do espaço disponível no dispositivo.

Para WebXR/VR, o navegador precisa oferecer suporte ao Cardboard e ao giroscópio. O site permanece no domínio HTTPS do GitHub Pages mesmo quando os recursos são entregues pelo cache offline.

## Arquivos principais

- `index.html`: experiência principal.
- `style.css`: identidade visual da página inicial e controles offline.
- `service-worker.js`: cache offline, incluindo suporte a requisições Range de vídeos.
- `manifest.webmanifest`: manifesto PWA.
- `vendor/aframe.min.js` e `vendor/webxr-polyfill.min.js`: bibliotecas locais publicadas pelo workflow do GitHub Pages.
- `assets/mapa.png`: mapa dos biomas.
- `amaz.png`, `Caatinga.png`, `Cer.png`, `Mata.png`, `Pantanal.png`, `Pampa.png`: panoramas 360°.
- `assets/biomas/`: imagens informativas e vídeos de fauna de cada bioma.

## Aplicativo Android

O repositório mantém a configuração do Capacitor e o fluxo do GitHub Actions para gerar um APK de depuração. A compatibilidade de WebXR/VR no WebView pode diferir da experiência no Chrome Android.

## Tecnologias

- HTML5, CSS3 e JavaScript
- A-Frame 1.8.0
- WebXR e WebXR Polyfill 2.0.3
- Service Worker e Cache API
- Capacitor
- GitHub Pages e GitHub Actions
