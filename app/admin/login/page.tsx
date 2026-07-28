import { redirect } from 'next/navigation';

/** El login ahora es compartido por admins y empleados: vive en /login. */
export default function AdminLoginRedirect() {
  redirect('/login');
}
