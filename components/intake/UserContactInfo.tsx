import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import GlassCard from '../ui/GlassCard';
import { Pencil, Save, X } from 'lucide-react';

interface UserContactInfoProps {
  user: any;
  onUpdate: (updatedInfo: any) => void;
}

export default function UserContactInfo({ user, onUpdate }: UserContactInfoProps) {
  // Always start in editing mode if user is null or has empty required fields
  const hasEmptyRequiredFields = !user || !user.firstName || !user.lastName || !user.email;
  const [isEditing, setIsEditing] = useState(true);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address1: user?.address1 || '',
    address2: user?.address2 || '',
    city: user?.city || '',
    state: user?.state || '',
    zip: user?.zip || '',
    country: user?.country || ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address1: user.address1 || '',
        address2: user.address2 || '',
        city: user.city || '',
        state: user.state || '',
        zip: user.zip || '',
        country: user.country || ''
      });
      if (!user.firstName || !user.lastName || !user.email) {
        setIsEditing(true);
      }
    }
  }, [user]);

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSave = () => {
    onUpdate(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address1: user?.address1 || '',
      address2: user?.address2 || '',
      city: user?.city || '',
      state: user?.state || '',
      zip: user?.zip || '',
      country: user?.country || ''
    });
    setIsEditing(false);
  };

  // Always render the component, even if user is null
  return (
    <GlassCard className="mb-2 p-3">
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-base font-semibold text-black">Contact Information</h3>
        {!isEditing && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="w-4 h-4 mr-2" />
            Edit
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
            <div className="space-y-1">
              <Label htmlFor="firstName" className="text-black">
                First Name *
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                className="glass border-[#4791FF]/30 text-black"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="lastName" className="text-black">
                Last Name *
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                className="glass border-[#4791FF]/30 text-black"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="email" className="text-black">
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="glass border-[#4791FF]/30 text-black"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="phone" className="text-black">
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="glass border-[#4791FF]/30 text-black"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="address1" className="text-black">
              Address Line 1
            </Label>
            <Input
              id="address1"
              value={formData.address1}
              onChange={(e) => handleChange('address1', e.target.value)}
              className="glass border-[#4791FF]/30 text-black"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="address2" className="text-black">
              Address Line 2
            </Label>
            <Input
              id="address2"
              value={formData.address2}
              onChange={(e) => handleChange('address2', e.target.value)}
              className="glass border-[#4791FF]/30 text-black"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
            <div className="space-y-1">
              <Label htmlFor="city" className="text-black">
                City
              </Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className="glass border-[#4791FF]/30 text-black"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="state" className="text-black">
                State
              </Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
                className="glass border-[#4791FF]/30 text-black"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="zip" className="text-black">
                Zip Code
              </Label>
              <Input
                id="zip"
                value={formData.zip}
                onChange={(e) => handleChange('zip', e.target.value)}
                className="glass border-[#4791FF]/30 text-black"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="country" className="text-black">
              Country
            </Label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) => handleChange('country', e.target.value)}
              className="glass border-[#4791FF]/30 text-black"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="bg-[#4791FF] hover:bg-[#3680ee] text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-1 text-sm text-black">
          <p>
            <strong>Name:</strong> {user?.firstName} {user?.lastName}
          </p>
          <p>
            <strong>Email:</strong> {user?.email}
          </p>
          {user?.phone && (
            <p>
              <strong>Phone:</strong> {user.phone}
            </p>
          )}
          {user?.address1 && (
            <p>
              <strong>Address:</strong> {user.address1}
              {user.address2 && `, ${user.address2}`}
              {(user.city || user.state || user.zip) && (
                <>
                  <br />
                  {user.city && `${user.city}, `}
                  {user.state && `${user.state} `}
                  {user.zip}
                </>
              )}
              {user.country && (
                <>
                  <br />
                  {user.country}
                </>
              )}
            </p>
          )}
        </div>
      )}
    </GlassCard>
  );
}
