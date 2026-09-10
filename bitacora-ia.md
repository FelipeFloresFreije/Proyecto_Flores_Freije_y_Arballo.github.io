# Bitácora de IA

## Trabajo Práctico N.º 1 – Proceso de Diseño de Interfaz de Usuario

**Materia:** Diseño de Interfaces de Usuario

**Proyecto:** Plataforma de Juegos Online – Temática Batman

**Herramienta de IA utilizada:** ChatGPT (GPT-5.5)

---

# Objetivo del uso de IA

La inteligencia artificial fue utilizada como herramienta de validación durante el proceso de diseño de la interfaz. Su función fue analizar el avance del proyecto, verificar el cumplimiento de los principios de UX/UI, evaluar la organización del Design System y proponer mejoras fundamentadas.

La IA no fue utilizada para generar automáticamente el Design System ni las interfaces del proyecto, respetando la consigna del trabajo práctico.

---

# Iteración 1 – Desarrollo inicial del Design System

## Estado inicial

Se desarrolló una primera versión del Design System incluyendo los elementos solicitados por la consigna:

* Paleta de colores.
* Tipografía.
* Logo.
* Iconografía.
* Botones.
* Cards de juegos.
* Carruseles.
* Navbar.
* Modal para compartir contenido.

El objetivo inicial fue construir un sistema de componentes reutilizable que sirviera como base para el desarrollo de las distintas pantallas.

---

## Validación realizada por IA

Durante la primera revisión se detectaron varios aspectos que podían mejorarse.

### Organización del Design System

Los componentes estaban distribuidos sobre el lienzo sin una organización clara.

Esto dificultaba identificar rápidamente la función de cada elemento y su reutilización.

**Motivo del cambio**

Un Design System correctamente organizado facilita el mantenimiento del proyecto y mejora la reutilización de componentes.

---

### Sistema tipográfico

Inicialmente solamente se indicaban las familias tipográficas:

* Chakra Petch.
* Roboto.

No existía documentación sobre tamaños, pesos, alturas de línea ni jerarquías.

**Motivo del cambio**

Una escala tipográfica correctamente documentada permite mantener consistencia visual entre todas las pantallas.

---

### Atomic Design

Aunque los componentes ya estaban desarrollados, todavía no se encontraban organizados siguiendo la metodología Atomic Design.

**Motivo del cambio**

Atomic Design permite clasificar los componentes según su nivel de complejidad, facilitando la escalabilidad del sistema.

---

## Cambios implementados

### Documentación tipográfica

Se creó una tabla tipográfica donde se especificó:

* Familia tipográfica.
* Peso.
* Tamaño.
* Altura de línea.
* Espaciado.

Además se definieron los estilos para títulos, botones, carruseles y cards.

---

### Organización del Design System

Se reorganizaron todos los componentes para facilitar su navegación y reutilización dentro del archivo.

---

### Implementación de Atomic Design

Los componentes fueron reorganizados de la siguiente manera.

### Átomos

* Paleta de Colores.
* Tipografía.
* Logo.
* Iconos.
* Botones.

### Moléculas

* Search Bar.
* Card Game.

### Organismos

* Navbar.
* Carrusel.
* Fat Footer.
* Modal para compartir.
* Ficha del Peg Solitaire.

---

## Resultado

El Design System pasó de ser una colección de componentes a un sistema organizado y reutilizable.

---

# Iteración 2 – Desarrollo de las pantallas

Con el Design System finalizado se comenzó el desarrollo de las interfaces solicitadas por la consigna.

---

## Pantalla Login

Se desarrolló la pantalla de registro e inicio de sesión.

Incluye:

* Logo.
* Formulario principal.
* Registro.
* Inicio de sesión.
* Acceso mediante Google.
* Acceso mediante Facebook.
* Recaptcha no funcional.

Todos los componentes reutilizan la identidad visual definida previamente.

---

## Pantalla Home

Se desarrolló la página principal de la plataforma.

Se implementaron:

* Header.
* Logo.
* Barra de búsqueda.
* Menú hamburguesa.
* Carruseles por categorías.
* Recomendaciones personalizadas.
* Fat Footer.

Todos los carruseles reutilizan el componente **Card Game** desarrollado previamente.

---

## Página del juego

Se desarrolló la página correspondiente al juego **Peg Solitaire** con temática Batman.

La interfaz incluye:

* Área destinada al juego.
* Breadcrumbs.
* Panel de ayuda.
* Información del juego.
* Galería.
* Enlaces útiles.
* Comunidad.
* Formulario para comentarios.
* Compartir por redes sociales.
* Botón para regresar al Home.

---

## Resultado

Las tres pantallas mantienen una identidad visual consistente gracias a la reutilización de componentes del Design System.

---

# Iteración 3 – Organización del archivo de Figma

Durante el desarrollo surgió una limitación del plan gratuito de Figma, que únicamente permitía trabajar con tres páginas dentro del archivo.

Para cumplir con la consigna se reorganizó el proyecto de la siguiente manera:

### Página 1

Design System.

### Página 2

Login.

### Página 3

Home y Game Page.

Dentro de la tercera página se utilizaron **Frames independientes** para representar ambas interfaces.

Esta decisión permitió mantener organizado el proyecto sin afectar el contenido solicitado por el trabajo práctico.

---

# Iteración 4 – Implementación del flujo del prototipo

Una vez finalizadas las interfaces se desarrolló el flujo interactivo del prototipo utilizando Figma.

---

## Estado inicial

Las pantallas eran estáticas y no existía navegación entre ellas.

---

## Validación realizada por IA

Se verificó que el flujo respetara el recorrido solicitado por la consigna.

También se recomendó configurar correctamente el punto inicial del prototipo y conectar todas las pantallas mediante interacciones.

---

## Cambios implementados

Se agregaron las interacciones necesarias para permitir la navegación entre los distintos frames.

Se definió el siguiente recorrido:

* Login → Home.
* Home → Game Page.
* Game Page → Home.

La pantalla de Login fue configurada como punto inicial del prototipo.

---

## Resultado

El proyecto pasó de ser un conjunto de pantallas estáticas a un prototipo navegable que permite recorrer la aplicación simulando el comportamiento esperado del usuario.

---

# Iteración 5 – Organización mediante Atomic Design

Durante una nueva revisión se detectó que una pantalla completa ("Desktop") estaba siendo utilizada como componente dentro del Design System.

La IA recomendó reorganizar el archivo diferenciando claramente componentes reutilizables, templates y páginas finales.

---

## Cambios implementados

Se reorganizó el proyecto siguiendo la metodología Atomic Design.

### Átomos

* Paleta de Colores.
* Tipografía.
* Logo.
* Iconos.
* Botones.

### Moléculas

* Search Bar.
* Card Game.

### Organismos

* Navbar.
* Carrusel.
* Fat Footer.
* Menú Hamburguesa.
* Ficha Peg Solitaire.

### Templates

Se organizaron los layouts principales del proyecto como:

* **Home Desktop.**
* **Home Open Menu Desktop.**
* **Game Page Desktop.**

Estos templates reutilizan los organismos desarrollados previamente y representan la estructura base de cada interfaz.

### Pages

Las páginas finales quedaron organizadas como:

* Login.
* Home.
* Game Page.

---

## Resultado

La estructura del archivo quedó alineada con la metodología Atomic Design, diferenciando correctamente componentes reutilizables, templates y páginas.

---

# Iteración 6 – Optimización de los Templates

Durante las pruebas del prototipo se observó que los primeros templates del Home utilizaban un tamaño aproximado de **1900 × 1686 px**, lo que provocaba que la presentación del prototipo se visualizara demasiado reducida en el modo Present de Figma.

---

## Validación realizada por IA

Se analizó la forma correcta de adaptar los templates sin afectar la estructura del diseño.

Se concluyó que una resolución de escritorio estándar mejora significativamente la experiencia de visualización y se ajusta mejor a un prototipo Desktop.

---

## Cambios implementados

Los templates correspondientes a:

* Home Desktop.
* Home Open Menu Desktop.

fueron redimensionados a **1440 × 1024 px**, manteniendo la distribución de los componentes y la estructura general de la interfaz.

Este cambio permitió que la presentación del prototipo fuera más cómoda y representativa de una resolución de escritorio estándar.

---

## Resultado

El prototipo mejoró su presentación visual durante las pruebas, manteniendo la consistencia del diseño sin afectar la organización de los componentes.

---

# Validaciones realizadas por IA

Durante todo el desarrollo la inteligencia artificial permitió validar:

* Organización del Design System.
* Escala tipográfica.
* Aplicación de Atomic Design.
* Consistencia de la paleta de colores.
* Reutilización de componentes.
* Organización del archivo de Figma.
* Correcta separación entre componentes reutilizables, templates y páginas.
* Implementación del patrón Fat Footer.
* Uso del menú hamburguesa.
* Desarrollo del flujo del prototipo.
* Adaptación de los templates a una resolución Desktop estándar (1440 × 1024).

Todas las observaciones fueron implementadas progresivamente durante el desarrollo del proyecto.

---

# Conclusión

La inteligencia artificial fue utilizada como una herramienta de validación y mejora continua durante todo el proceso de diseño.

Las principales mejoras realizadas fueron:

* Organización del Design System.
* Documentación completa de la tipografía.
* Implementación de Atomic Design.
* Reutilización consistente de componentes.
* Desarrollo de las tres interfaces solicitadas.
* Implementación del flujo interactivo del prototipo.
* Organización del archivo mediante Templates y Pages.
* Adaptación de los templates a una resolución de escritorio de **1440 × 1024 px**, mejorando la visualización del prototipo.

Gracias a estas iteraciones, el proyecto evolucionó desde una primera versión del sistema de componentes hasta un prototipo organizado, consistente e interactivo, cumpliendo los requisitos establecidos en la consigna y dejando preparado el archivo para su presentación y defensa.

