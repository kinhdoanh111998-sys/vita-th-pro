-- Allow authenticated customers to create their own orders from /checkout
CREATE POLICY "Customers insert own orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (customer_id = auth.uid());

-- Allow authenticated customers to insert order_items for their own orders
CREATE POLICY "Customers insert own order_items"
ON public.order_items
FOR INSERT
TO authenticated
WITH CHECK (
  order_id IN (SELECT id FROM public.orders WHERE customer_id = auth.uid())
);

-- Allow authenticated users to insert their own notifications (checkout success message)
CREATE POLICY "Users insert own notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (recipient_id = auth.uid());