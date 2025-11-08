
import Link from 'next/link';
import { Mic, UserCog, Users, MessageSquareText, UserCircle, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { QRCodeDialog } from './admin/QRCodeDialog';
import { useUser, useAuth, initiateSignOut } from '@/firebase';

export function Header({ isAdmin = false }: { isAdmin?: boolean }) {
  const { user, isKJ } = useUser();
  const auth = useAuth();

  const handleLogout = () => {
    if (auth) {
      initiateSignOut(auth);
    }
  };

  return (
    <header className="py-3 px-4 md:px-6 border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-sm z-20">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/home" className="flex items-center gap-3 group">
          <div className="p-2 bg-primary/20 rounded-lg group-hover:bg-primary/30 transition-colors">
            <Mic className="text-primary h-6 w-6" />
          </div>
          <h1 className="font-headline text-xl md:text-2xl whitespace-nowrap">
            Sing A Long Karaoke
          </h1>
        </Link>
        <nav className="flex items-center gap-2">
           <Button asChild variant="ghost" size="sm">
              <Link href="/reviews">
                <MessageSquareText className="mr-2 h-4 w-4" />
                Reviews
              </Link>
            </Button>
            {user && (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/profile">
                    <UserCircle className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </>
            )}
            
            {isKJ && (
              isAdmin ? (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/home">
                    <Users className="mr-2 h-4 w-4" />
                    Patron View
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/admin">
                    <UserCog className="mr-2 h-4 w-4" />
                    KJ View
                  </Link>
                </Button>
              )
            )}

            {isAdmin && <QRCodeDialog />}
        </nav>
      </div>
    </header>
  );
}
