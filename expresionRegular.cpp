#include <iostream>
#include <regex>
#include <string>
using namespace std;

int main() {
    string linea;

    cout << "Ingrese una linea de codigo " << endl;
    cout << "Ejemplo: float total = 300 - aumento" << endl;
    cout << "Linea: "; 
	 
    if (!getline(cin, linea)) {
        cout << "Error: no se pudo leer la entrada." << endl;
        return 1;
    }

    if (linea.empty()) {
        cout << "Error: la linea esta vacia." << endl;
        return 1;
    }

    regex patron_identificador("[a-zA-Z_]\\w*");
    regex patron_numero("\\d+");
    regex patron_operador("[+*\/=\\-]");
	regex patron_token("[a-zA-Z_]\\w*|\\d+|[+*\/=\\-]");

    auto inicio = sregex_iterator(linea.begin(), linea.end(), patron_token);
    auto fin    = sregex_iterator();

    cout << "\nTokens encontrados:\n";
    cout << "-----------------------------\n";

    for (auto i = inicio; i != fin; i++) {
        string token = i->str();
        string tipo;

        if (regex_match(token, patron_identificador)) {
            tipo = "IDENTIFICADOR";
        } else if (regex_match(token, patron_numero)) {
            tipo = "NUMERO";
        } else if (regex_match(token, patron_operador)) {
            tipo = "OPERADOR";
        }

        cout << "Token: " << token << " --> Tipo: " << tipo << endl;
    }

    return 0;
}
