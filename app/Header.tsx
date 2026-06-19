"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Moon, Plus, Sun, TrendingUp } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import Link from "next/link";

export default function Header() {
  const { data: session } = useSession();
  const { setTheme } = useTheme();

  return (
    <header className="w-full bg-background border-b py-4 px-4 md:px-8">
      <nav className="flex justify-between items-center gap-4">
        <Link
          href="/"
          className="text-lg md:text-xl font-bold text-foreground hover:text-primary transition-colors truncate">
          Stock Tracker
        </Link>
        <div className="flex items-center gap-2 md:gap-4">
          {session ? (
            <>
              <div className="flex items-center gap-1 md:gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 md:h-10 md:w-10"
                  title="Portfolio">
                  <Link href="/portfolio">
                    <TrendingUp className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 md:h-10 md:w-10"
                  title="Add Transaction">
                  <Link href="/transactions">
                    <Plus className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="flex items-center gap-2 md:gap-4">
                <div className="text-xs md:text-sm text-muted-foreground hidden sm:block">
                  {session.user?.name && <div>{session.user.name}</div>}
                  <div className="truncate">{session.user?.email}</div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 md:h-10 md:w-10">
                      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                      <span className="sr-only">Toggle theme</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setTheme("light")}>
                      Light
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("dark")}>
                      Dark
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("system")}>
                      System
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="destructive"
                  onClick={() => signOut()}
                  size="sm"
                  className="text-xs md:text-sm h-9 md:h-10">
                  Sign Out
                </Button>
              </div>
            </>
          ) : (
            <Button asChild size="sm">
              <Link href="/login">Sign In</Link>
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
}
