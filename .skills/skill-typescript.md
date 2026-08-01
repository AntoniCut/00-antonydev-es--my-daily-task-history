---
name: skill-typescript
description: Convenciones y estilo personal para escribir o editar archivos TypeScript. Úsala SIEMPRE que se escriba, revise, refactorice o corrija código TypeScript (incluyendo dentro de archivos .astro, .tsx o similares), aunque el usuario no la mencione explícitamente. Cubre reglas de código (sin dependencias externas, sin var, sin alert/confirm/prompt, sin innerHTML, HTML semántico, prevenir default en eventos) y reglas de tipado nativo (interfaces, types, genéricos, formato de comentarios de función, referencias al HTML, tsconfig).
---

# Skill TypeScript — Convenciones de Antonio

Esta skill define cómo debe escribirse cualquier código TypeScript (dentro de `.ts`, `.tsx`, `.astro`, etc.) para este usuario. Aplica estas reglas siempre, sin que el usuario tenga que repetirlas en cada petición.

## Preferencias de código

- No añadir dependencias externas (ni librerías, ni paquetes npm) salvo que el usuario lo pida explícitamente.
- El HTML generado o manipulado debe ser semántico (usar `<button>`, `<nav>`, `<section>`, `<article>`, etc. según corresponda, nunca `<div>`/`<span>` genéricos cuando exista una etiqueta más adecuada).
- Usar siempre `let` o `const`. Nunca usar `var`.
- Nunca usar `alert`, `confirm` ni `prompt`. Todo el feedback al usuario debe ser visual, insertado en el DOM.
- Utilizar funciones de flecha (arrow function): `const nombre = (): void => {}`.
- Cualquier alerta o ventana modal customizada debe reutilizar los mismos estilos visuales que el resto de la web (mismas variables CSS, misma tipografía, mismo lenguaje visual).
- Nunca usar `innerHTML`. Todo contenido debe insertarse con `appendChild`, creando previamente el elemento con `document.createElement`.
- Prestar especial atención a `event.preventDefault()` en eventos `submit` o `click` cuando el comportamiento por defecto del navegador no sea el deseado.
- Priorizar siempre código legible, mantenible y sencillo de entender por encima de soluciones ingeniosas pero crípticas.
- Si hay ambigüedad sobre cómo implementar algo: primero revisar las especificaciones del proyecto (si existen archivos de contexto/README/otros componentes); si sigue sin estar claro, preguntar al usuario en vez de asumir.
- Evitar `any` salvo justificación explícita; preferir `unknown` + comprobación de tipo cuando el tipo real no se conozca de antemano.

## Preferencias de tipado (TypeScript nativo)

### Variables

Anotar el tipo explícitamente cuando no se infiera con claridad:
```ts
// - `nombre del usuario`
const name: string = 'Antonio';
```

Si el tipo se infiere fácilmente (literal obvio), no anotar tipo, solo un comentario descriptivo:
```ts
// - `edad del usuario`
const edad = 15;
```

### Tipos personalizados

Los tipos personalizados del dominio se definen con `interface` o `type` en:
```
/types/types.ts
```

Preferir `interface` para formas de objeto extensibles y `type` para uniones, alias o tipos derivados.

Los tipos DOM extendidos (p. ej. elementos custom o APIs no presentes en `lib.dom.d.ts`) se definen en:
```
/types/global.d.ts
```

Importarlos donde corresponda (o dejarlos como ambientales si están en `global.d.ts`):
```ts
import type { Nota, EstadoApp } from '../../types/types';
```

El proyecto debe tener un `tsconfig.json` en la raíz equivalente a:

```json
{
  "compilerOptions": {
    "strict": true,
    "noEmit": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true
  },
  "include": [
    "assets/ts/**/*.ts",
    "types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
```

### Funciones

Seguir este formato exacto de comentario para cada función, con tipado nativo en la firma (sin `@param`/`@return` de JSDoc):

```ts
/**
 * ------------------------------------------------------
 * -----  `aplicarEstiloEtiqueta(elemento, color)`  -----
 * ------------------------------------------------------
 * - Aplica el estilo de la etiqueta al elemento.
 */
const aplicarEstiloEtiqueta = (elemento: HTMLElement, color: string): void => {
    elemento.style.setProperty("--tag-color", color);
    elemento.style.setProperty("--tag-bg", colorConAlpha(color, 0.14));
}
```

Reglas del bloque:

- Segunda línea: exactamente **5 guiones** (`-----`), dos espacios, firma entre backticks, dos espacios, **5 guiones**.
- Primera y tercera línea: solo guiones, con **la misma longitud** que el contenido de la segunda línea (sin contar el ` * `).
- La descripción de parámetros y retorno se confía a los tipos de la firma; el comentario solo describe **qué hace** la función.

Ejemplo corto:

```ts
/**
 * -------------------------
 * -----  `crearId()`  -----
 * -------------------------
 * - Genera un identificador único para una nota.
 */
const crearId = (): string => {
    return crypto.randomUUID();
}
```

- Descripción breve de qué hace la función (con guion inicial).
- Tipar todos los parámetros y el valor de retorno directamente en la firma (usar `void` si no retorna nada).

### Referencias al HTML

Agruparlas bajo un bloque de sección y tiparlas con el elemento concreto, usando `as` en vez de un cast JSDoc:

```ts
/*
    *  ---------------------------------  *
    *  -----  Referencias al HTML  -----  *
    *  ---------------------------------  *
*/

// - `Aside de la App`
const sidebar = document.getElementById("sidebar") as HTMLElement;

// - `Botón flotante nueva nota`
const btnFabNueva = document.getElementById("btn-fab-nueva") as HTMLButtonElement;
```

- El comentario describe la variable.
- El `as` tipa el valor de `getElementById` (que devuelve `HTMLElement | null`).
- Usar el tipo DOM más concreto posible (`HTMLButtonElement`, `HTMLInputElement`, `HTMLFormElement`, `HTMLUListElement`, `HTMLDivElement`, `HTMLHeadingElement`, `HTMLParagraphElement`, `HTMLElement`, etc.).

### Comentarios no tipables

Lo que no se pueda documentar con tipos (eventos, `if/else`, `try/catch`, bloques lógicos, etc.) debe comentarse con este formato de separadores:

```ts
//  -----  click en menu  -----
btnMenu.addEventListener("click", (event: MouseEvent) => {
    event.preventDefault();

    //  -----  si el sidebar está abierto, cerrarlo  -----
    if (sidebar.classList.contains("is-open")) {
        cerrarSidebarMovil();
    }
    //  -----  si el sidebar está cerrado, abrirlo  -----
    else {
        abrirSidebarMovil();
    }
});
```

- Doble espacio después de `//`, guiones a ambos lados del texto descriptivo, todo en minúsculas salvo nombres propios.
- Colocar el comentario justo antes del bloque que describe.

## Preferencias de comentarios de código

### Inicio del archivo

```ts
/*
    *  --------------------------------------------------------------------------  *
    *  -----  nombre-archivo.ts  --  /carpeta/subcarpeta/nombre-archivo.ts  -----  *
    *  --------------------------------------------------------------------------  *
*/
```

## Checklist rápido antes de entregar código

- [ ] ¿Hay algún `var`? → cambiar a `let`/`const`
- [ ] ¿Hay `innerHTML`? → cambiar a `createElement` + `appendChild`
- [ ] ¿Hay `alert`/`confirm`/`prompt`? → sustituir por feedback visual en el DOM
- [ ] ¿Los eventos `submit`/`click` previenen el default cuando corresponde?
- [ ] ¿El HTML usado es semántico?
- [ ] ¿Se usan funciones de flecha con tipos en la firma?
- [ ] ¿Las funciones tienen el bloque de comentario con 5 guiones y separadores de igual longitud (sin `@param`/`@return`)?
- [ ] ¿Las variables no triviales tienen tipo explícito o comentario descriptivo?
- [ ] ¿Las referencias al HTML usan `as` con el tipo DOM concreto?
- [ ] ¿Hay algún `any` sin justificar? → sustituir por `unknown` + comprobación, o un tipo concreto
- [ ] ¿Existen `types/types.ts`, `types/global.d.ts` y `tsconfig.json` alineados?
- [ ] ¿Se añadió alguna dependencia externa sin que se pidiera?
