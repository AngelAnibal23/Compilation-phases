const readline = require("readline");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function preguntar(prompt) {
  return new Promise((resolve) => rl.question(prompt, resolve));
}

function separador(char = "=", largo = 65) {
  console.log(char.repeat(largo));
}

function encabezado() {
  separador();
  console.log("     SIMULADOR DE ALU - ARITMÉTICA DEL COMPUTADOR");
  separador();
}

function obtenerRangos(bits, opcion) {
  if (opcion === 1 || opcion === 2) {
    return { minVal: -(2 ** (bits - 1) - 1), maxVal: 2 ** (bits - 1) - 1 };
  }
  return { minVal: -(2 ** (bits - 1)), maxVal: 2 ** (bits - 1) - 1 };
}

function decimalABinarioAbsoluto(numero, bits) {
  return Math.abs(numero).toString(2).padStart(bits, "0");
}

function calcularSignoMagnitud(numero, bits) {
  return (numero >= 0 ? "0" : "1") + decimalABinarioAbsoluto(numero, bits - 1);
}

function calcularComplementoAUno(numero, bits) {
  const binPuro = decimalABinarioAbsoluto(numero, bits);
  if (numero >= 0) return binPuro;
  return binPuro.split("").map((b) => (b === "0" ? "1" : "0")).join("");
}

function calcularComplementoADos(numero, bits) {
  if (numero >= 0) return decimalABinarioAbsoluto(numero, bits);
  const c1 = calcularComplementoAUno(numero, bits);
  return (parseInt(c1, 2) + 1).toString(2).padStart(bits, "0").slice(-bits);
}

async function seleccionarBits() {
  while (true) {
    separador("-", 65);
    console.log("  PASO 1 — Ingrese el ancho de palabra (bits):");
    console.log("  (Ejemplos: 4, 8, 16, 32 — mínimo 2 bits)");
    separador("-", 65);
    const bits = parseInt(await preguntar("  Número de bits: "));
    if (!isNaN(bits) && bits >= 2) { console.log(`\n  ✔  Ancho configurado: ${bits} bits\n`); return bits; }
    console.log(bits < 2 ? "  ✘  Mínimo 2 bits.\n" : "  ✘  Número entero inválido.\n");
  }
}

async function menuPrincipal() {
  while (true) {
    separador("-", 65);
    console.log("  MENÚ PRINCIPAL");
    separador("-", 65);
    console.log("    [1]  Conversión (Signo Magnitud / C1 / C2)");
    console.log("    [2]  Multiplicación — Algoritmo de Booth (con signo)");
    console.log("    [3]  Multiplicación — Shift-and-Add (sin signo)");
    console.log("    [s]  Salir");
    separador("-", 65);
    const op = (await preguntar("  Opción: ")).trim().toLowerCase();
    if (op === "1") return "conversion";
    if (op === "2") return "booth";
    if (op === "3") return "sinSigno";
    if (op === "s") return "salir";
    console.log("  ✘  Opción no válida.\n");
  }
}

async function seleccionarSistema() {
  while (true) {
    separador("-", 65);
    console.log("  Seleccione el sistema de representación:");
    console.log("    [a]  Signo Magnitud");
    console.log("    [b]  Complemento a 1");
    console.log("    [c]  Complemento a 2");
    console.log("    [s]  Volver");
    separador("-", 65);
    const op = (await preguntar("  Opción (a/b/c/s): ")).trim().toLowerCase();
    if (op === "a") return { opcion: 1, nombreSistema: "Signo Magnitud" };
    if (op === "b") return { opcion: 2, nombreSistema: "Complemento a 1" };
    if (op === "c") return { opcion: 3, nombreSistema: "Complemento a 2" };
    if (op === "s") return { opcion: null, nombreSistema: null };
    console.log("  ✘  Opción no válida.\n");
  }
}

async function ingresarNumero(bits, opcion, nombreSistema, etiqueta = "número") {
  const { minVal, maxVal } = obtenerRangos(bits, opcion);
  separador("-", 65);
  console.log(`  SISTEMA : ${nombreSistema}  |  BITS: ${bits}  |  RANGO: [${minVal}, ${maxVal}]`);
  separador("-", 65);
  while (true) {
    const n = parseInt(await preguntar(`  Ingrese el ${etiqueta} (decimal): `));
    if (isNaN(n)) { console.log("  ✘  Número inválido.\n"); continue; }
    if (n >= minVal && n <= maxVal) return n;
    console.log(`  ✘  OVERFLOW: ${n} fuera de [${minVal}, ${maxVal}].\n`);
  }
}

function mostrarResultado(numero, bits, opcion, nombreSistema) {
  let r;
  if (opcion === 1) r = calcularSignoMagnitud(numero, bits);
  else if (opcion === 2) r = calcularComplementoAUno(numero, bits);
  else r = calcularComplementoADos(numero, bits);
  const grupos = r.match(/.{1,4}/g).join(" ");
  separador();
  console.log("  RESULTADO DE CONVERSIÓN");
  separador();
  console.log(`  Decimal  : ${numero}`);
  console.log(`  Sistema  : ${nombreSistema}`);
  console.log(`  Bits     : ${bits}`);
  console.log(`  Binario  : ${grupos}`);
  separador();
}

function sumarBinario(a, b) {
  const n = a.length;
  let carry = 0;
  const result = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    const s = a[i] + b[i] + carry;
    result[i] = s % 2;
    carry = Math.floor(s / 2);
  }
  return result;
}

function notBinario(a) {
  return a.map((b) => 1 - b);
}

function complemento2Array(a) {
  const uno = new Array(a.length).fill(0);
  uno[uno.length - 1] = 1;
  return sumarBinario(notBinario(a), uno);
}

function desplazarDerecha(A, Q) {
  const signoBit = A[0];
  const nuevoQ1 = Q[Q.length - 1];
  const nuevoQ = [A[A.length - 1], ...Q.slice(0, Q.length - 1)];
  const nuevoA = [signoBit, ...A.slice(0, A.length - 1)];
  return { A: nuevoA, Q: nuevoQ, Q1: nuevoQ1 };
}

function desplazarDerechaLogico(A, Q) {
  const nuevoQ1 = Q[Q.length - 1];
  const nuevoQ = [A[A.length - 1], ...Q.slice(0, Q.length - 1)];
  const nuevoA = [0, ...A.slice(0, A.length - 1)];
  return { A: nuevoA, Q: nuevoQ, Q1: nuevoQ1 };
}

function bitsADecimalC2(bits) {
  if (bits[0] === 0) return parseInt(bits.join(""), 2);
  const mag = parseInt(notBinario(bits).join(""), 2) + 1;
  return -mag;
}

function bitsADecimalSinSigno(bits) {
  return parseInt(bits.join(""), 2);
}

function formatBits(arr) {
  const s = arr.join("");
  return s.match(/.{1,4}/g).join(" ");
}

async function multiplicacionBooth() {
  separador();
  console.log("  MULTIPLICACIÓN — ALGORITMO DE BOOTH (con signo, C2)");
  separador();

  while (true) {
    separador("-", 65);
    const inputBits = parseInt(await preguntar("  Bits del MULTIPLICANDO M (mínimo 2): "));
    if (isNaN(inputBits) || inputBits < 2) { console.log("  ✘  Mínimo 2 bits.\n"); continue; }

    const mBits = inputBits;
    const mMin = -(2 ** (mBits - 1)), mMax = 2 ** (mBits - 1) - 1;
    console.log(`  Rango M (${mBits} bits C2): [${mMin}, ${mMax}]`);

    const M_dec = parseInt(await preguntar("  Valor decimal de M (multiplicando): "));
    if (isNaN(M_dec) || M_dec < mMin || M_dec > mMax) {
      console.log(`  ✘  Valor fuera de rango [${mMin}, ${mMax}].\n`); continue;
    }

    const nBits = parseInt(await preguntar("  Bits del MULTIPLICADOR Q (mínimo 2): "));
    if (isNaN(nBits) || nBits < 2) { console.log("  ✘  Mínimo 2 bits.\n"); continue; }

    const qMin = -(2 ** (nBits - 1)), qMax = 2 ** (nBits - 1) - 1;
    console.log(`  Rango Q (${nBits} bits C2): [${qMin}, ${qMax}]`);

    const Q_dec = parseInt(await preguntar("  Valor decimal de Q (multiplicador): "));
    if (isNaN(Q_dec) || Q_dec < qMin || Q_dec > qMax) {
      console.log(`  ✘  Valor fuera de rango [${qMin}, ${qMax}].\n`); continue;
    }

    const aBits = mBits + 1; // bit extra para absorber carry en sumas intermedias
    const mArr = calcularComplementoADos(M_dec, aBits).split("").map(Number);
    const mNeg = complemento2Array(mArr);
    const qArr = calcularComplementoADos(Q_dec, nBits).split("").map(Number);

    let A = new Array(aBits).fill(0);
    let Q = [...qArr];
    let Q1 = 0;

    separador();
    console.log("  TABLA DE BOOTH");
    separador("-", 65);

    const hA = "A".padEnd(aBits * 2);
    const hQ = "Q".padEnd(nBits * 2);
    console.log(`  ${"Paso".padEnd(6)} | ${"Operación".padEnd(20)} | ${hA} | ${hQ} | Q-1`);
    separador("-", 65);

    console.log(
      `  ${"0".padEnd(6)} | ${"Inicio".padEnd(20)} | ${formatBits(A).padEnd(aBits * 2)} | ${formatBits(Q).padEnd(nBits * 2)} | ${Q1}`
    );

    const mostrarFila = (paso, op, a, q, q1) =>
      console.log(
        `  ${String(paso).padEnd(6)} | ${op.padEnd(20)} | ${formatBits(a).padEnd(aBits * 2)} | ${formatBits(q).padEnd(nBits * 2)} | ${q1}`
      );

    for (let i = 1; i <= nBits; i++) {
      const q0 = Q[Q.length - 1];

      if (q0 === 1 && Q1 === 0) {
        A = sumarBinario(A, mNeg);
        mostrarFila(i, `A = A - M (${formatBits(mNeg)})`, A, Q, Q1);
      } else if (q0 === 0 && Q1 === 1) {
        A = sumarBinario(A, mArr);
        mostrarFila(i, `A = A + M (${formatBits(mArr)})`, A, Q, Q1);
      } else {
        mostrarFila(i, "Sin operación", A, Q, Q1);
      }

      const shifted = desplazarDerecha(A, Q);
      A = shifted.A;
      Q = shifted.Q;
      Q1 = shifted.Q1;
      mostrarFila(i, ">> Desplazamiento", A, Q, Q1);
    }

    separador("-", 65);

    // Se descarta el bit extra de A antes de concatenar
    const resultadoBits = [...A.slice(1), ...Q];
    const totalBits = mBits + nBits;
    const resultado_dec = bitsADecimalC2(resultadoBits);
    const esperado = M_dec * Q_dec;

    separador();
    console.log("  RESULTADO FINAL");
    separador();
    const mMostrar = calcularComplementoADos(M_dec, mBits).match(/.{1,4}/g).join(" ");
    console.log(`  M (multiplicando)  : ${M_dec}  →  ${mMostrar}  (${mBits} bits)`);
    console.log(`  Q (multiplicador)  : ${Q_dec}  →  ${formatBits(qArr)}  (${nBits} bits)`);
    console.log(`  A || Q (${totalBits} bits)   : ${formatBits(resultadoBits)}`);
    console.log(`  Resultado decimal  : ${resultado_dec}`);
    console.log(`  Verificación       : ${M_dec} × ${Q_dec} = ${esperado}  ${resultado_dec === esperado ? "✔  CORRECTO" : "✘  REVISAR (overflow posible)"}`);
    separador();

    console.log("  REGLAS DE BOOTH:");
    console.log("    Q0=1, Q-1=0  →  A = A - M");
    console.log("    Q0=0, Q-1=1  →  A = A + M");
    console.log("    Q0=Q-1       →  Sin operación, solo desplazar");
    console.log("  Desplazamiento: aritmético a la derecha (extensión de signo)");
    separador();

    break;
  }
}

async function multiplicacionSinSigno() {
  separador();
  console.log("  MULTIPLICACIÓN — SHIFT-AND-ADD (sin signo, binario puro)");
  separador();

  while (true) {
    separador("-", 65);
    const mBits = parseInt(await preguntar("  Bits del MULTIPLICANDO M (mínimo 2): "));
    if (isNaN(mBits) || mBits < 2) { console.log("  ✘  Mínimo 2 bits.\n"); continue; }

    const mMax = 2 ** mBits - 1;
    console.log(`  Rango M (${mBits} bits): [0, ${mMax}]`);

    const M_dec = parseInt(await preguntar("  Valor decimal de M (multiplicando): "));
    if (isNaN(M_dec) || M_dec < 0 || M_dec > mMax) {
      console.log(`  ✘  Valor fuera de rango [0, ${mMax}].\n`); continue;
    }

    const nBits = parseInt(await preguntar("  Bits del MULTIPLICADOR Q (mínimo 2): "));
    if (isNaN(nBits) || nBits < 2) { console.log("  ✘  Mínimo 2 bits.\n"); continue; }

    const qMax = 2 ** nBits - 1;
    console.log(`  Rango Q (${nBits} bits): [0, ${qMax}]`);

    const Q_dec = parseInt(await preguntar("  Valor decimal de Q (multiplicador): "));
    if (isNaN(Q_dec) || Q_dec < 0 || Q_dec > qMax) {
      console.log(`  ✘  Valor fuera de rango [0, ${qMax}].\n`); continue;
    }

    const aBits = mBits + 1;
    const mArr = M_dec.toString(2).padStart(mBits, "0").split("").map(Number);
    const mArrExt = [0, ...mArr]; // M extendido a aBits para sumar contra A
    const qArr = Q_dec.toString(2).padStart(nBits, "0").split("").map(Number);

    let A = new Array(aBits).fill(0);
    let Q = [...qArr];

    separador();
    console.log("  TABLA SHIFT-AND-ADD");
    separador("-", 65);

    const hA = "A".padEnd(aBits * 2);
    const hQ = "Q".padEnd(nBits * 2);
    console.log(`  ${"Paso".padEnd(6)} | ${"Operación".padEnd(20)} | ${hA} | ${hQ}`);
    separador("-", 65);

    console.log(
      `  ${"0".padEnd(6)} | ${"Inicio".padEnd(20)} | ${formatBits(A).padEnd(aBits * 2)} | ${formatBits(Q).padEnd(nBits * 2)}`
    );

    const mostrarFila = (paso, op, a, q) =>
      console.log(
        `  ${String(paso).padEnd(6)} | ${op.padEnd(20)} | ${formatBits(a).padEnd(aBits * 2)} | ${formatBits(q).padEnd(nBits * 2)}`
      );

    for (let i = 1; i <= nBits; i++) {
      const q0 = Q[Q.length - 1];

      if (q0 === 1) {
        A = sumarBinario(A, mArrExt);
        mostrarFila(i, `A = A + M (${formatBits(mArr)})`, A, Q);
      } else {
        mostrarFila(i, "Sin operación", A, Q);
      }

      const shifted = desplazarDerechaLogico(A, Q);
      A = shifted.A;
      Q = shifted.Q;
      mostrarFila(i, ">> Desplazamiento", A, Q);
    }

    separador("-", 65);

    // Se descarta el bit extra de A antes de concatenar
    const resultadoBits = [...A.slice(1), ...Q];
    const totalBits = mBits + nBits;
    const resultado_dec = bitsADecimalSinSigno(resultadoBits);
    const esperado = M_dec * Q_dec;

    separador();
    console.log("  RESULTADO FINAL");
    separador();
    console.log(`  M (multiplicando)  : ${M_dec}  →  ${formatBits(mArr)}  (${mBits} bits)`);
    console.log(`  Q (multiplicador)  : ${Q_dec}  →  ${formatBits(qArr)}  (${nBits} bits)`);
    console.log(`  A || Q (${totalBits} bits)   : ${formatBits(resultadoBits)}`);
    console.log(`  Resultado decimal  : ${resultado_dec}`);
    console.log(`  Verificación       : ${M_dec} × ${Q_dec} = ${esperado}  ${resultado_dec === esperado ? "✔  CORRECTO" : "✘  REVISAR (overflow posible)"}`);
    separador();

    console.log("  REGLAS SHIFT-AND-ADD:");
    console.log("    Q0=1  →  A = A + M");
    console.log("    Q0=0  →  Sin operación, solo desplazar");
    console.log("  Desplazamiento: lógico a la derecha (rellena con 0)");
    separador();

    break;
  }
}

async function main() {
  encabezado();

  while (true) {
    const modo = await menuPrincipal();

    if (modo === "salir") {
      separador();
      console.log("   Fin de la sesión. ¡Hasta pronto!");
      separador();
      rl.close();
      return;
    }

    if (modo === "booth") {
      await multiplicacionBooth();
      separador("-", 65);
      const cont = (await preguntar("  ¿Realizar otra operación? (s/n): ")).trim().toLowerCase();
      if (cont !== "s") { separador(); console.log("   Fin de la sesión. ¡Hasta pronto!"); separador(); rl.close(); return; }
      continue;
    }

    if (modo === "sinSigno") {
      await multiplicacionSinSigno();
      separador("-", 65);
      const cont = (await preguntar("  ¿Realizar otra operación? (s/n): ")).trim().toLowerCase();
      if (cont !== "s") { separador(); console.log("   Fin de la sesión. ¡Hasta pronto!"); separador(); rl.close(); return; }
      continue;
    }

    const bits = await seleccionarBits();
    while (true) {
      const { opcion, nombreSistema } = await seleccionarSistema();
      if (opcion === null) { console.log("\n  ↩  Volviendo al menú...\n"); break; }

      const numero = await ingresarNumero(bits, opcion, nombreSistema);
      mostrarResultado(numero, bits, opcion, nombreSistema);

      separador("-", 65);
      const cont = (await preguntar("  ¿Otra conversión? (s/n): ")).trim().toLowerCase();
      if (cont !== "s") { separador(); console.log("   Fin de la sesión. ¡Hasta pronto!"); separador(); rl.close(); return; }
      console.log();
    }
  }
}

main();
