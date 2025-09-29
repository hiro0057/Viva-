# Mapa de Apoio Escolar

Este projeto é um aplicativo web que funciona como um mapa de apoio, mostrando locais importantes como hospitais, supermercados, UPAs e escolas com base na localização do usuário.

## Funcionalidades

- Obtenção da localização atual do usuário
- Visualização de mapa interativo usando Google Maps
- Busca de locais próximos por categoria:
  - Hospitais
  - Supermercados
  - Escolas
  - Farmácias
  - Restaurantes
- Lista de resultados com detalhes dos locais encontrados
- Interface responsiva para uso em dispositivos móveis e desktop

## Como usar

1. Abra o arquivo `index.html` em um navegador web moderno
2. Clique no botão "Obter Localização" para compartilhar sua localização
3. Selecione uma categoria de locais para visualizar no mapa
4. Clique em um local na lista para centralizar o mapa nele

## Requisitos técnicos

- Navegador web moderno com suporte a JavaScript e Geolocalização
- Conexão com a internet para carregar o Google Maps e buscar locais

## Nota importante

Para que o aplicativo funcione corretamente, você precisa:

1. Substituir `YOUR_API_KEY` no arquivo `index.html` por uma chave de API válida do Google Maps com acesso às APIs Maps JavaScript e Places
2. Permitir que o navegador acesse sua localização quando solicitado

## Estrutura do projeto

- `index.html` - Estrutura da página web
- `styles.css` - Estilos e layout da interface
- `script.js` - Funcionalidades de geolocalização e integração com o Google Maps
- `img/` - Pasta com imagens e ícones utilizados no projeto

## Tecnologias utilizadas

- HTML5
- CSS3
- JavaScript
- Google Maps API
- Google Places API