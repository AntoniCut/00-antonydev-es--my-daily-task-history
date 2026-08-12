/*
    *  --------------------------------------------------------------------  *
    *  -----  create-user.ts  --  /server/src/scripts/create-user.ts  -----  *
    *  --------------------------------------------------------------------  *
*/
import { randomUUID } from 'node:crypto';
import { createInterface } from 'node:readline';
import { stdin, stdout } from 'node:process';
import { hashPassword } from '../services/auth.service.js';
import { usersStorage } from '../storage/usersStorage.js';
import type { AuthUser } from '../types/types.js';

const MAX_USERNAME_LENGTH = 40;
const MIN_PASSWORD_LENGTH = 8;

/**
 * ---------------------------
 * -----  `readHidden()`  -----
 * ---------------------------
 * - Lee una contraseña desde la terminal sin mostrar el eco de teclas.
 */
const readHidden = (query: string): Promise<string> =>
    new Promise((resolve, reject) => {
        //  -----  sin terminal interactiva no se puede ocultar el eco  -----
        if (typeof stdin.setRawMode !== 'function') {
            reject(new Error('Se necesita una terminal interactiva para la contraseña'));
            return;
        }

        stdout.write(query);
        stdin.setRawMode(true);
        stdin.resume();
        stdin.setEncoding('utf8');

        let buffer = '';

        /**
         * ---------------------------
         * -----  `onData()`  -----
         * ---------------------------
         * - Acumula las teclas pulsadas y resuelve al pulsar Enter.
         */
        const onData = (chunk: string): void => {
            for (const char of chunk) {
                //  -----  Enter: terminar la lectura  -----
                if (char === '\r' || char === '\n') {
                    stdin.removeListener('data', onData);
                    stdin.setRawMode(false);
                    stdin.pause();
                    stdout.write('\n');
                    resolve(buffer);
                    return;
                }

                //  -----  Ctrl+C: abortar  -----
                if (char === '\u0003') {
                    stdin.removeListener('data', onData);
                    stdin.setRawMode(false);
                    stdin.pause();
                    process.exit(130);
                }

                //  -----  retroceso: borrar el último carácter  -----
                if (char === '\u007f' || char === '\b') {
                    buffer = buffer.slice(0, -1);
                }
                //  -----  resto de caracteres visibles: acumular  -----
                else if (char >= ' ') {
                    buffer += char;
                }
            }
        };

        stdin.on('data', onData);
    });

/**
 * ------------------------------
 * -----  `readPrompt()`  -----
 * ------------------------------
 * - Lee una línea visible desde la terminal.
 */
const readPrompt = (query: string): Promise<string> =>
    new Promise((resolve) => {
        const rl = createInterface({ input: stdin, output: stdout });
        rl.question(query, (answer: string): void => {
            rl.close();
            resolve(answer);
        });
    });

/**
 * -----------------------------
 * -----  `readArg()`  -----
 * -----------------------------
 * - Lee el valor de un argumento tipo `--clave valor`.
 */
const readArg = (flag: string): string | undefined => {
    const index = process.argv.indexOf(flag);
    return index >= 0 ? process.argv[index + 1] : undefined;
};

/**
 * -----------------------------------
 * -----  `requireUsername()`  -----
 * -----------------------------------
 * - Pide el nombre de usuario por argumento o por terminal.
 */
const requireUsername = async (): Promise<string> => {
    let username = readArg('--username')?.trim() ?? '';

    //  -----  si viene vacío por argumento, preguntarlo en la terminal  -----
    if (!username) {
        username = (await readPrompt('Nombre de usuario: ')).trim();
    }

    //  -----  validación básica de longitud  -----
    if (username.length > MAX_USERNAME_LENGTH) {
        throw new Error(
            `El nombre de usuario no puede superar ${MAX_USERNAME_LENGTH} caracteres`,
        );
    }

    if (!username) {
        throw new Error('El nombre de usuario es obligatorio');
    }

    return username;
};

/**
 * -----------------------------------
 * -----  `requirePassword()`  -----
 * -----------------------------------
 * - Pide la contraseña y su confirmación, ocultando el eco.
 */
const requirePassword = async (): Promise<string> => {
    const password = await readHidden('Contraseña: ');

    //  -----  longitud mínima razonable para una contraseña  -----
    if (password.length < MIN_PASSWORD_LENGTH) {
        throw new Error(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`);
    }

    const confirmation = await readHidden('Repite la contraseña: ');
    if (confirmation !== password) {
        throw new Error('Las contraseñas no coinciden');
    }

    return password;
};

/**
 * ------------------------------
 * -----  `main()`  -----
 * ------------------------------
 * - Crea o actualiza un usuario con contraseña hasheada.
 */
const main = async (): Promise<void> => {
    const username = await requireUsername();
    const password = await requirePassword();
    const existing = await usersStorage.findByUsername(username);

    const { hash, salt } = await hashPassword(password);

    const user: AuthUser = {
        id: existing?.id ?? randomUUID(),
        username,
        passwordHash: hash,
        salt,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
    };

    await usersStorage.upsert(user);

    const action = existing ? 'actualizado' : 'creado';
    console.log(`Usuario "${username}" ${action} correctamente`);
};

main().catch((error: unknown) => {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
});
