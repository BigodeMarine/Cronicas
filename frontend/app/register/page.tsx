"use client";

import { useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { register } from "@/services/api";

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        setError("");
        setSuccess("");
        setLoading(true);

        try {
            await register(name, email, password);

            router.push("/login");
        } catch (err) {
            console.error(err);
            setError("Não foi possível realizar o cadastro.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main>
            <h1>Criar conta</h1>

            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="name">Nome</label>
                    <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        required
                    />
                </div>

                <div>
                    <label htmlFor="email">E-mail</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                    />
                </div>

                <div>
                    <label htmlFor="password">Senha</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                    />
                </div>

                {error && <p>{error}</p>}

                {success && <p>{success}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? "Cadastrando..." : "Criar conta"}
                </button>
            </form>
        </main>
    );
}