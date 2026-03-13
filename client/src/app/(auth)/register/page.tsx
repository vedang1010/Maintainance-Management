'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FLAT_NUMBERS } from '@/lib/constants';
import api from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    flat_no: '',
    phone: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingManager, setCheckingManager] = useState(true);
  const [checkingFlat, setCheckingFlat] = useState(false);

  // Check manager exists
  useEffect(() => {
    const checkManager = async () => {
      try {
        const response = await api.get('/auth/manager-exists');
        if (!response.data.data?.exists) {
          router.push('/manager-setup');
        }
      } catch (err) {
        console.error('Error checking manager:', err);
      } finally {
        setCheckingManager(false);
      }
    };

    checkManager();
  }, [router]);

  // Redirect authenticated users
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  // Check flat availability
  const checkFlatAvailability = async (flat: string) => {
    try {
      setCheckingFlat(true);

      const res = await api.get(`/auth/check-flat?flat_no=${flat}`);

      if (!res.data.data.available) {
        setError('This flat already has a registered resident.');
        return false;
      }

      return true;
    } catch (err) {
      console.error(err);
      return true;
    } finally {
      setCheckingFlat(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    const { name, email, password, confirmPassword, flat_no, phone } =
      formData;

    if (!name || !email || !password || !confirmPassword || !flat_no || !phone) {
      setError('Please fill in all fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Password validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Phone validation
    if (!/^\d{10}$/.test(phone)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    // Check flat availability
    const available = await checkFlatAvailability(flat_no);

    if (!available) return;

    setLoading(true);

    try {
      const response = await api.post('/auth/register', {
        name,
        email,
        password,
        flat_no,
        phone,
      });

      if (response.data.success) {
        setSuccess('Registration successful! Redirecting to login...');

        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(response.data.message || 'Registration failed');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || checkingManager) {
    return (
      <Card className="shadow-lg">
        <CardContent className="py-8">
          <div className="flex justify-center">
            <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Create Account
        </CardTitle>

        <CardDescription className="text-center">
          Register as a resident
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500 bg-green-50 text-green-700">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>

            <Input
              id="name"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>

            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Flat + Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Flat Number</Label>

              <Select
                value={formData.flat_no}
                onValueChange={(v) => handleChange('flat_no', v)}
                disabled={loading || checkingFlat}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select flat" />
                </SelectTrigger>

                <SelectContent>
                  {FLAT_NUMBERS.map((flat) => (
                    <SelectItem key={flat} value={flat}>
                      {flat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Phone</Label>

              <Input
                placeholder="10 digit number"
                value={formData.phone}
                onChange={(e) =>
                  handleChange(
                    'phone',
                    e.target.value.replace(/\D/g, '').slice(0, 10)
                  )
                }
                disabled={loading}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label>Password</Label>

            <Input
              type="password"
              placeholder="Minimum 6 characters"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label>Confirm Password</Label>

            <Input
              type="password"
              placeholder="Re-enter password"
              value={formData.confirmPassword}
              onChange={(e) =>
                handleChange('confirmPassword', e.target.value)
              }
              disabled={loading}
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full"
            disabled={loading || !formData.flat_no}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>

          <p className="text-sm text-center text-gray-600">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-primary font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}