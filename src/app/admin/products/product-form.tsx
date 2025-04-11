const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);
  setError(null);

  try {
    // Validate required fields
    if (!formData.name || !formData.slug || !formData.price || !formData.categoryId) {
      throw new Error('Please fill in all required fields');
    }

    // Validate categoryId is not empty
    if (formData.categoryId === '') {
      throw new Error('Please select a category');
    }

    const response = await fetch(`/api/admin/products/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      // Handle successful submission
      console.log('Product updated successfully');
    } else {
      throw new Error('Failed to update product');
    }
  } catch (error) {
    setError(error.message);
  } finally {
    setIsSubmitting(false);
  }
}; 