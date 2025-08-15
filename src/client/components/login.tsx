import React, { useContext, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { getLogger } from '@transitive-sdk/utils-web';
import { UserContext } from '@components/user-context';
import { cn } from '@/lib/utils';
import { Button } from '@components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@components/ui/card';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';

const log = getLogger('App');
log.setLevel('debug');

export const Login = ({ className, ...props }: React.ComponentProps<'div'>) => {
  const { login, error, session } = useContext(UserContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  if (session && session.user) {
    return <Navigate to="/dashboard/devices" />;
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-neutral-900">
      <div className={cn('w-full max-w-sm', className)} {...props}>
        <Card>
          <CardHeader>
            <CardTitle>Login to your account</CardTitle>
            <CardDescription>
              Enter your username below to login to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                login(username, password);
              }}
            >
              <div className="flex flex-col gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    <a
                      href="#"
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </a>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                {error && <div className="text-red-500 text-sm">{error}</div>}

                <div className="flex flex-col gap-3">
                  <Button
                    type="submit"
                    className="w-full bg-neutral-900 text-white hover:bg-neutral-400"
                  >
                    Login
                  </Button>
                  <Button variant="outline" type="button" className="w-full" disabled>
                    Login with Google
                  </Button>
                </div>
              </div>

              <div className="mt-4 text-center text-sm">
                Don&apos;t have an account?{' '}
                <Link to="/create-account" className="underline underline-offset-4">
                  Create an account
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};