# Alin Store · Sitio de Amazon Afiliados

Tienda estática en HTML, CSS y JavaScript. Incluye catálogo, búsqueda y filtros, asesor de compras local, administración de productos y registro manual de resultados de Amazon.

## Abrir la tienda en tu computadora

Abre una terminal dentro de esta carpeta y ejecuta:

```bash
python -m http.server 8000
```

Después visita `http://localhost:8000`. No abras `index.html` con doble clic: el navegador necesita el servidor para cargar el catálogo.

## Antes de compartir la página

1. Solicita y confirma tu aprobación en Amazon Associates para el mercado donde vas a promocionar productos.
2. En `js/main.js`, reemplaza `CAMBIAR-TAG-20` por tu tag aprobado. Mientras no lo hagas, los botones de compra quedan desactivados.
3. Abre **Administrar** y edita o elimina los productos de ejemplo. Añade enlaces completos HTTPS de páginas de producto de Amazon, imágenes que tengas derecho a usar y descripciones honestas. El tag se añade automáticamente.
4. Verifica los enlaces desde la tienda y comprueba la divulgación de afiliado antes de publicar.
5. Publica en un alojamiento estático con HTTPS, por ejemplo GitHub Pages.

Los productos, precios y valoraciones del archivo `data/products.json` son solo ejemplos. No compartas la web como catálogo listo para comprar hasta reemplazarlos.

## Administrar productos y resultados

- **Productos:** desde Administrar puedes agregar, editar, ocultar o eliminar artículos. Los cambios se guardan en el `localStorage` del navegador.
- **Clics salientes:** el panel cuenta clics activados desde este navegador. No son pedidos ni prueban que una compra ocurrió.
- **Ventas y comisión:** consulta los reportes de Amazon Associates y registra manualmente fecha, producto, pedidos, unidades, ventas atribuidas y comisión. Las vistas Día, Mes y Año agrupan los registros guardados.
- **Respaldo:** usa Descargar respaldo JSON con frecuencia. Para migrar de dispositivo, copia ese archivo al otro navegador y usa Restaurar respaldo. Sin respaldo, limpiar los datos del navegador puede borrar el catálogo y los registros.
- La tienda no procesa pagos: el cliente termina la compra en Amazon. El panel local no se sincroniza ni tiene autenticación de servidor.

## Consejos para mejorar las ventas

- Empieza con una categoría concreta y productos que conozcas; una selección pequeña y útil facilita comparar.
- Explica para quién sirve cada producto, qué problema resuelve y qué limitaciones tiene. No publiques reseñas o valoraciones inventadas.
- Usa fotos autorizadas, títulos claros y una llamada a la acción visible. Mantén el tag y los enlaces correctos.
- Comparte guías y comparativas útiles en los canales donde está tu audiencia; mide las visitas y revisa los resultados reales en Associates Central.
- Revisa periódicamente enlaces, disponibilidad, políticas del programa y contenido de divulgación.

## Archivos principales

```text
index.html             Tienda pública y panel de administración
styles.css             Estilos de tienda, panel y asesor
js/main.js             Catálogo, filtros, modal y enlaces de afiliado
js/admin.js            Gestión local, métricas y respaldo
js/ai-assistant.js     Recomendador local del catálogo
data/products.json     Catálogo inicial de ejemplo
legal/                 Aviso de afiliado, privacidad y términos
```

El asesor funciona en modo local y no necesita una clave de IA. No configures claves secretas en JavaScript público.
