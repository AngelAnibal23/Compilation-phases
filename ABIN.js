// =============================================================================
//  SIMULADOR DE ALU - REPRESENTACIÓN DE ENTEROS CON SIGNO
//  Asignatura: Arquitectura de Computadoras
//  Tema: Signo Magnitud | Complemento a 1 | Complemento a 2
// =============================================================================

const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Promisify readline para usar con async/await
function preguntar(prompt) {
  return new Promise((resolve) => rl.question(prompt, resolve));
}

// ------------------------------------------------------------------------------
// UTILIDADES DE CONSOLA
// ------------------------------------------------------------------------------

function separador(char = "=", largo = 55) {
  console.log(char.repeat(largo));
}

function encabezado() {
  separador();
  console.log("   SIMULADOR DE ALU - ARITMÉTICA DEL COMPUTADOR");
  separador();
}

// ------------------------------------------------------------------------------
// 1. RANGOS
// ------------------------------------------------------------------------------

function obtenerRangos(bits, opcion) {
  if (opcion === 1 || opcion === 2) {
    // Signo Magnitud o Complemento a 1
    const minVal = -(2 ** (bits - 1) - 1);
    const maxVal = 2 ** (bits - 1) - 1;
    return { minVal, maxVal };
  } else {
    // Complemento a 2
    const minVal = -(2 ** (bits - 1));
    const maxVal = 2 ** (bits - 1) - 1;
    return { minVal, maxVal };
  }
}

// ------------------------------------------------------------------------------
// 2. CONVERSIONES (misma lógica que el código base Python de la guía)
// ------------------------------------------------------------------------------

function decimalABinarioAbsoluto(numero, bits) {
  return Math.abs(numero).toString(2).padStart(bits, "0");
}

function calcularSignoMagnitud(numero, bits) {
  const msb = numero >= 0 ? "0" : "1";
  const magnitud = decimalABinarioAbsoluto(numero, bits - 1);
  return msb + magnitud;
}

function calcularComplementoAUno(numero, bits) {
  const binPuro = decimalABinarioAbsoluto(numero, bits);
  if (numero >= 0) return binPuro;
  // Inversión bit a bit (NOT)
  return binPuro
    .split("")
    .map((b) => (b === "0" ? "1" : "0"))
    .join("");
}

function calcularComplementoADos(numero, bits) {
  if (numero >= 0) return decimalABinarioAbsoluto(numero, bits);
  // C2 = C1 + 1
  const c1 = calcularComplementoAUno(numero, bits);
  const valorC2 = parseInt(c1, 2) + 1;
  // Truncar al ancho de palabra para evitar bits fantasmas
  return valorC2.toString(2).padStart(bits, "0").slice(-bits);
}

// ------------------------------------------------------------------------------
// 3. SELECCIÓN DE BITS
// ------------------------------------------------------------------------------

async function seleccionarBits() {
  while (true) {
    separador("-", 55);
    console.log("  PASO 1 — Ingrese el ancho de palabra (bits):");
    console.log("  (Ejemplos: 4, 8, 16, 32 — mínimo 2 bits)");
    separador("-", 55);

    const entrada = await preguntar("  Número de bits: ");
    const bits = parseInt(entrada);

    if (!isNaN(bits) && bits >= 2) {
      console.log(`\n  ✔  Ancho de palabra configurado: ${bits} bits\n`);
      return bits;
    } else if (!isNaN(bits) && bits < 2) {
      console.log("  ✘  El mínimo es 2 bits. Intente de nuevo.\n");
    } else {
      console.log("  ✘  Ingrese un número entero válido.\n");
    }
  }
}

// ------------------------------------------------------------------------------
// 4. SELECCIÓN DE SISTEMA
// ------------------------------------------------------------------------------

async function seleccionarSistema() {
  while (true) {
    separador("-", 55);
    console.log("  PASO 2 — Seleccione el sistema de representación:");
    separador("-", 55);
    console.log("    [a]  Signo Magnitud");
    console.log("    [b]  Complemento a 1");
    console.log("    [c]  Complemento a 2");
    console.log("    [s]  Salir / Cambiar ancho de palabra");
    separador("-", 55);

    const opcion = (await preguntar("  Ingrese su opción (a/b/c/s): "))
      .trim()
      .toLowerCase();

    if (opcion === "a") return { opcion: 1, nombreSistema: "Signo Magnitud" };
    if (opcion === "b") return { opcion: 2, nombreSistema: "Complemento a 1" };
    if (opcion === "c") return { opcion: 3, nombreSistema: "Complemento a 2" };
    if (opcion === "s") return { opcion: null, nombreSistema: null };

    console.log("  ✘  Opción no válida. Intente de nuevo.\n");
  }
}

// ------------------------------------------------------------------------------
// 5. INGRESO Y VALIDACIÓN DEL NÚMERO
// ------------------------------------------------------------------------------

async function ingresarNumero(bits, opcion, nombreSistema) {
  const { minVal, maxVal } = obtenerRangos(bits, opcion);

  separador("-", 55);
  console.log(`  SISTEMA : ${nombreSistema}`);
  console.log(`  BITS    : ${bits}`);
  console.log(`  RANGO   : [${minVal}  →  ${maxVal}]`);
  separador("-", 55);

  while (true) {
    const entrada = await preguntar("  Ingrese el número decimal: ");
    const numero = parseInt(entrada);

    if (isNaN(numero)) {
      console.log("  ✘  Ingrese un número entero válido.\n");
      continue;
    }

    if (numero >= minVal && numero <= maxVal) {
      return numero;
    } else {
      console.log(
        `\n  ✘  OVERFLOW: ${numero} está fuera del rango ` +
          `[${minVal}, ${maxVal}] para ${bits} bits en ${nombreSistema}.\n`
      );
    }
  }
}

// ------------------------------------------------------------------------------
// 6. MOSTRAR RESULTADO
// ------------------------------------------------------------------------------

function mostrarResultado(numero, bits, opcion, nombreSistema) {
  let resultado;
  if (opcion === 1) resultado = calcularSignoMagnitud(numero, bits);
  else if (opcion === 2) resultado = calcularComplementoAUno(numero, bits);
  else resultado = calcularComplementoADos(numero, bits);

  // Agrupar en bloques de 4 bits para mejor lectura
  const grupos = resultado.match(/.{1,4}/g).join(" ");

  separador();
  console.log("  RESULTADO");
  separador();
  console.log(`  Decimal  : ${numero}`);
  console.log(`  Sistema  : ${nombreSistema}`);
  console.log(`  Bits     : ${bits}`);
  console.log(`  Binario  : ${grupos}`);
  separador();
}

// ------------------------------------------------------------------------------
// 7. CICLO PRINCIPAL
// ------------------------------------------------------------------------------

async function main() {
  encabezado();

  while (true) {
    const bits = await seleccionarBits();

    while (true) {
      const { opcion, nombreSistema } = await seleccionarSistema();

      if (opcion === null) {
        console.log("\n  ↩  Volviendo a la selección de bits...\n");
        break;
      }

      const numero = await ingresarNumero(bits, opcion, nombreSistema);
      mostrarResultado(numero, bits, opcion, nombreSistema);

      separador("-", 55);
      const continuar = (
        await preguntar("  ¿Desea realizar otra conversión? (s/n): ")
      )
        .trim()
        .toLowerCase();

      if (continuar !== "s") {
        separador();
        console.log("   Fin de la sesión. ¡Hasta pronto!");
        separador();
        rl.close();
        return;
      }
      console.log();
    }
  }
}

main();
