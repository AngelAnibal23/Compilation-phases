/*
 * ============================================================
 *  GUÍA PRÁCTICA 1 - Analizador Léxico en C
 *  UNJBG - Ingeniería en Informática y Sistemas
 * ============================================================
 *  Funcionalidades implementadas:
 *   [Base]  Palabras clave, identificadores, números enteros
 *   [Base]  Operadores y delimitadores
 *   [Act.1] Números reales (ej: 3.14, 2.0)
 *   [Act.2] Cadenas de texto (ej: "hola")
 *   [Act.3] Comentarios simples y multilínea
 *   [Act.4] Manejo de errores léxicos con línea y columna
 * ============================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

/* ========================
   TIPOS DE TOKEN
======================== */
typedef enum {
    KEYWORD,
    IDENTIFIER,
    NUMBER_INT,
    NUMBER_REAL,    /* Actividad 1 */
    OPERATOR,
    DELIMITER,
    STRING_TOKEN,   /* Actividad 2 */
    COMMENT,        /* Actividad 3 */
    UNKNOWN,
    LEX_ERROR       /* Actividad 4 */
} TokenType;

/* ========================
   ESTRUCTURA TOKEN
======================== */
typedef struct {
    TokenType type;
    char      lexeme[256];
    int       line;
    int       col;
} Token;

/* ========================
   ESTADO DEL LEXER
======================== */
typedef struct {
    FILE *file;
    int   line;
    int   col;
    int   error_count;
} LexerState;

/* ========================
   PALABRAS CLAVE
======================== */
const char *KEYWORDS[] = {
    "int", "float", "char", "double", "void",
    "if", "else", "while", "for", "do",
    "return", "break", "continue", "struct"
};
const int NUM_KEYWORDS = 14;

/* ========================
   FUNCIONES AUXILIARES
======================== */
int isLetter(char c) {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
}

int isDigit(char c) {
    return (c >= '0' && c <= '9');
}

int isKeyword(const char *str) {
    for (int i = 0; i < NUM_KEYWORDS; i++) {
        if (strcmp(str, KEYWORDS[i]) == 0)
            return 1;
    }
    return 0;
}

const char *tokenTypeName(TokenType t) {
    switch (t) {
        case KEYWORD:      return "KEYWORD";
        case IDENTIFIER:   return "IDENTIFIER";
        case NUMBER_INT:   return "NUMBER_INT";
        case NUMBER_REAL:  return "NUMBER_REAL";
        case OPERATOR:     return "OPERATOR";
        case DELIMITER:    return "DELIMITER";
        case STRING_TOKEN: return "STRING";
        case COMMENT:      return "COMMENT";
        case UNKNOWN:      return "UNKNOWN";
        case LEX_ERROR:    return "ERROR";
        default:           return "?";
    }
}

/* ========================
   AVANZAR CARÁCTER
======================== */
char nextChar(LexerState *ls) {
    char c = (char)fgetc(ls->file);
    if (c == '\n') {
        ls->line++;
        ls->col = 0;
    } else {
        ls->col++;
    }
    return c;
}

void pushBack(LexerState *ls, char c) {
    ungetc(c, ls->file);
    if (c == '\n') {
        ls->line--;
    } else {
        ls->col--;
    }
}

/* ========================
   IMPRESIÓN DE TOKEN
======================== */
void printToken(Token *t) {
    if (t->type == LEX_ERROR) {
        printf("  [%-12s] lexema: %-20s  linea: %d  col: %d  <-- ERROR LEXICO\n",
               tokenTypeName(t->type), t->lexeme, t->line, t->col);
    } else if (t->type == COMMENT) {
        printf("  [%-12s] lexema: %-20s  linea: %d\n",
               tokenTypeName(t->type), t->lexeme, t->line);
    } else {
        printf("  [%-12s] lexema: %-20s  linea: %d  col: %d\n",
               tokenTypeName(t->type), t->lexeme, t->line, t->col);
    }
}

/* ========================
   LEXER PRINCIPAL
======================== */
void lexer(LexerState *ls) {
    char c;
    Token tok;

    while ((c = nextChar(ls)) != EOF) {

        /* --- Ignorar espacios en blanco --- */
        if (isspace(c)) continue;

        /* ================================
           ACTIVIDAD 3: Comentarios // y /* * /
        ================================ */
        if (c == '/') {
            char next = nextChar(ls);

            /* Comentario de una línea // */
            if (next == '/') {
                tok.line = ls->line;
                tok.col  = ls->col - 1;
                int i = 0;
                char cc;
                while ((cc = nextChar(ls)) != '\n' && cc != EOF) {
                    if (i < 254) tok.lexeme[i++] = cc;
                }
                tok.lexeme[i] = '\0';
                tok.type = COMMENT;
                /* Formato breve para comentarios */
                printf("  [%-12s] // %s\n", "COMMENT", tok.lexeme);
                continue;
            }

            /* Comentario multilínea /* ... * / */
            if (next == '*') {
                tok.line = ls->line;
                tok.col  = ls->col - 1;
                int i = 0;
                char prev = 0;
                char cc;
                int closed = 0;
                while ((cc = nextChar(ls)) != EOF) {
                    if (prev == '*' && cc == '/') {
                        closed = 1;
                        break;
                    }
                    if (i < 253) tok.lexeme[i++] = cc;
                    prev = cc;
                }
                tok.lexeme[i > 0 ? i - 1 : 0] = '\0'; /* quita el * final */
                tok.type = COMMENT;
                if (!closed) {
                    printf("  [%-12s] lexema: %-20s  linea: %d  col: %d  <-- ERROR: comentario sin cerrar\n",
                           "ERROR", "/* ...", tok.line, tok.col);
                    ls->error_count++;
                } else {
                    printf("  [%-12s] /* %s */\n", "COMMENT", tok.lexeme);
                }
                continue;
            }

            /* No es comentario: es operador / */
            pushBack(ls, next);
            tok.type    = OPERATOR;
            tok.lexeme[0] = c;
            tok.lexeme[1] = '\0';
            tok.line = ls->line;
            tok.col  = ls->col;
            printToken(&tok);
            continue;
        }

        /* ================================
           IDENTIFICADORES Y PALABRAS CLAVE
        ================================ */
        if (isLetter(c) || c == '_') {
            int i = 0;
            tok.line = ls->line;
            tok.col  = ls->col;
            do {
                tok.lexeme[i++] = c;
                c = nextChar(ls);
            } while ((isLetter(c) || isDigit(c) || c == '_') && i < 254);
            tok.lexeme[i] = '\0';
            pushBack(ls, c);

            tok.type = isKeyword(tok.lexeme) ? KEYWORD : IDENTIFIER;
            printToken(&tok);
            continue;
        }

        /* ================================
           NÚMEROS ENTEROS Y REALES (Actividad 1)
        ================================ */
        if (isDigit(c)) {
            int i = 0;
            int is_real = 0;
            tok.line = ls->line;
            tok.col  = ls->col;

            do {
                tok.lexeme[i++] = c;
                c = nextChar(ls);
            } while (isDigit(c) && i < 254);

            /* Número real: parte decimal */
            if (c == '.') {
                char peek = nextChar(ls);
                if (isDigit(peek)) {
                    is_real = 1;
                    tok.lexeme[i++] = c;   /* el punto */
                    tok.lexeme[i++] = peek;
                    c = nextChar(ls);
                    while (isDigit(c) && i < 254) {
                        tok.lexeme[i++] = c;
                        c = nextChar(ls);
                    }
                } else {
                    /* el punto no va seguido de dígito → no es real */
                    pushBack(ls, peek);
                }
            }

            tok.lexeme[i] = '\0';
            pushBack(ls, c);
            tok.type = is_real ? NUMBER_REAL : NUMBER_INT;
            printToken(&tok);
            continue;
        }

        /* ================================
           ACTIVIDAD 2: Cadenas de texto "..."
        ================================ */
        if (c == '"') {
            int i = 0;
            tok.line = ls->line;
            tok.col  = ls->col;
            char cc;
            int closed = 0;
            while ((cc = nextChar(ls)) != EOF && cc != '\n') {
                if (cc == '"') { closed = 1; break; }
                if (i < 254) tok.lexeme[i++] = cc;
            }
            tok.lexeme[i] = '\0';

            if (!closed) {
                tok.type = LEX_ERROR;
                snprintf(tok.lexeme, sizeof(tok.lexeme), "\"%s  (cadena sin cerrar)", tok.lexeme);
                ls->error_count++;
            } else {
                tok.type = STRING_TOKEN;
            }
            printToken(&tok);
            continue;
        }

        /* ================================
           OPERADORES (incluyendo dobles: ==, !=, <=, >=)
        ================================ */
        if (c == '=' || c == '!' || c == '<' || c == '>') {
            tok.line    = ls->line;
            tok.col     = ls->col;
            char next   = nextChar(ls);
            tok.lexeme[0] = c;
            if (next == '=') {
                tok.lexeme[1] = '=';
                tok.lexeme[2] = '\0';
            } else {
                tok.lexeme[1] = '\0';
                pushBack(ls, next);
            }
            tok.type = OPERATOR;
            printToken(&tok);
            continue;
        }

        if (c == '+' || c == '-' || c == '*' || c == '%') {
            tok.type      = OPERATOR;
            tok.lexeme[0] = c;
            tok.lexeme[1] = '\0';
            tok.line = ls->line;
            tok.col  = ls->col;
            printToken(&tok);
            continue;
        }

        /* ================================
           DELIMITADORES
        ================================ */
        if (c == ';' || c == ',' || c == '(' || c == ')' ||
            c == '{' || c == '}' || c == '[' || c == ']') {
            tok.type      = DELIMITER;
            tok.lexeme[0] = c;
            tok.lexeme[1] = '\0';
            tok.line = ls->line;
            tok.col  = ls->col;
            printToken(&tok);
            continue;
        }

        /* ================================
           ACTIVIDAD 4: Error léxico
        ================================ */
        tok.type      = LEX_ERROR;
        tok.lexeme[0] = c;
        tok.lexeme[1] = '\0';
        tok.line = ls->line;
        tok.col  = ls->col;
        ls->error_count++;
        printToken(&tok);
    }
}

/* ========================
   FUNCIÓN PRINCIPAL
======================== */
int main(int argc, char *argv[]) {
    const char *filename = (argc > 1) ? argv[1] : "input.c";

    printf("============================================================\n");
    printf("  ANALIZADOR LEXICO - GUIA PRACTICA 1\n");
    printf("  UNJBG - Ingenieria en Informatica y Sistemas\n");
    printf("  Archivo: %s\n", filename);
    printf("============================================================\n\n");

    FILE *file = fopen(filename, "r");
    if (!file) {
        fprintf(stderr, "Error: No se pudo abrir el archivo '%s'\n", filename);
        return 1;
    }

    LexerState ls;
    ls.file        = file;
    ls.line        = 1;
    ls.col         = 0;
    ls.error_count = 0;

    printf("TOKENS ENCONTRADOS:\n");
    printf("------------------------------------------------------------\n");
    lexer(&ls);
    printf("------------------------------------------------------------\n\n");

    printf("RESUMEN:\n");
    printf("  Errores lexicos encontrados: %d\n", ls.error_count);
    if (ls.error_count == 0)
        printf("  Estado: OK - Analisis completado sin errores.\n");
    else
        printf("  Estado: ADVERTENCIA - Revisar errores antes de continuar.\n");
    printf("============================================================\n");

    fclose(file);
    return 0;
}	