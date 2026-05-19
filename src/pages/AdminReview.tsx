import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Listing {
  _id: string;
  stockId: string;
  make: string;
  model: string;
  year: number;
  price: number;
  status: 'pending' | 'approved' | 'rejected';
  sourceUrl: string;
}

const AdminReview = () => {
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/listings');
      const data = await response.json();
      setListings(data);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/listings/approve/${id}`, {
        method: 'POST',
      });
      if (response.ok) {
        toast.success('Listing approved!');
        fetchListings();
      }
    } catch (error) {
      toast.error('Failed to approve listing');
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Admin Review Queue</h1>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Stock ID</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listings.map((listing) => (
              <TableRow key={listing._id}>
                <TableCell className="font-medium">{listing.stockId}</TableCell>
                <TableCell>{listing.make} {listing.model}</TableCell>
                <TableCell>{listing.year}</TableCell>
                <TableCell>${listing.price.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant={listing.status === 'pending' ? 'outline' : 'default'}>
                    {listing.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {listing.status === 'pending' && (
                    <Button size="sm" onClick={() => handleApprove(listing._id)}>
                      Approve
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" asChild>
                    <a href={listing.sourceUrl} target="_blank" rel="noreferrer">View Source</a>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminReview;
