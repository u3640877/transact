import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button, buttonVariants } from '@components/ui/button';
import { ScrollArea } from '@components/ui/scroll-area';
import { ModeToggle } from '@components/ui/mode-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@components/ui/dropdown-menu';
import { Bot, CircleUser } from 'lucide-react';
import { UserContext } from '@components/user-context';

/** Creates a button linking to the provided `to` link. Highlights the button
 * when current location matches that link. */
const PageLink = ({ section }) => {
  const location = useLocation();
  const to = `/dashboard${section.route}`;
  return (
    <Link
      className={
        'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary w-full ' +
        buttonVariants({ variant: location.pathname.includes(to) ? 'secondary' : 'ghost' })
      }
      to={to}
    >
      <section.icon />
      <span className="grow text-left">{section.displayName}</span>
    </Link>
  );
};

export function Sidebar() {
  const { session, logout } = useContext(UserContext);
  return (
    <div className="h-full flex-col gap-2 border-r bg-muted/40 flex max-h-screen">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6 gap-4 font-semibold">
        <img src="/superbots_logo.png" className="h-11 w-11" />
        <div>
          <div className="text-xs text-muted-foreground font-normal">NAJA</div>
          <div style={{ fontSize: '1.4rem', lineHeight: '1rem' }}>DashBoard</div>
        </div>
      </div>
      <ScrollArea className="grow grid items-start px-2 text-sm font-medium lg:px-4">
        <PageLink section={{ route: '/devices', icon: Bot, displayName: 'Devices' }} key="devices-link" />
      </ScrollArea>
      <ModeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full ml-2 mb-2 lg:ml-4 lg:mb-4">
            <CircleUser className="h-5 w-5" />
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          {session && session.user && <DropdownMenuLabel>{session.user}</DropdownMenuLabel>}
          <DropdownMenuSeparator />
          {session && session.user && (
            <DropdownMenuItem>
              <Button variant="ghost" onClick={logout}>
                Logout
              </Button>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}