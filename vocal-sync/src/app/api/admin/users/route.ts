import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getDb, saveDb } from "@/lib/db";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    // Don't leak passwords in the list (though for a local admin it's fine, but better practice)
    const secureUsers = db.users.map(({ password, ...u }: any) => u);
    return NextResponse.json({ users: secureUsers });
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user } = await req.json();
    const db = getDb();

    // Check if email already exists
    if (db.users.some((u: any) => u.email === user.email)) {
        return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    db.users.push(user);
    saveDb(db);

    return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id === (session.user as any).id) {
        return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
    }

    const db = getDb();
    db.users = db.users.filter((u: any) => u.id !== id);
    saveDb(db);

    return NextResponse.json({ success: true });
}
