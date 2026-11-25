# Portfólio · Enzo

Site estático (HTML, CSS e JS puros, sem build). Basta servir a pasta, por exemplo com nginx apontando `root` para cá.

```
index.html
assets/css/tokens.css   cores e fontes (cópia de brand/tokens.css)
assets/css/style.css    layout e componentes
assets/js/main.js       idioma, WhatsApp, menu, animações
assets/i18n/pt.json     textos em português (padrão)
assets/i18n/en.json     textos em inglês
assets/img/             logo, favicons, imagens dos projetos, og.png
brand/                  arquivos-fonte da marca
```

## O que trocar
- **Número do WhatsApp:** constante `NUMERO` no topo de `assets/js/main.js` (DDI + DDD + número, só dígitos).
- **Projetos:** troque `assets/img/projeto-01.png` a `03.png` (4:3, de preferência 1200×900) e os textos `projects.*` nos dois JSONs e no `index.html`.
- **Instagram:** no rodapé do `index.html` há um comentário mostrando onde colocar o link.
- **Open Graph:** quando o domínio existir, troque `assets/img/og.png` no `<head>` pela URL completa.

## Textos
O português está no HTML (aparece mesmo sem JS) e também em `pt.json`. Ao mudar um texto, mude nos dois lugares.
O seletor de idioma carrega os JSONs com `fetch`, então teste por um servidor (`python3 -m http.server`), não abrindo o arquivo direto.
