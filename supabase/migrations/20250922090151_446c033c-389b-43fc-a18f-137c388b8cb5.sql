-- Create RLS policies for daily_workouts table to allow administrators to manage workouts

-- Allow administrators to insert daily workouts
CREATE POLICY "Administrators can insert daily workouts" 
ON public.daily_workouts 
FOR INSERT 
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'administrador'::app_role));

-- Allow administrators to update daily workouts
CREATE POLICY "Administrators can update daily workouts" 
ON public.daily_workouts 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'administrador'::app_role));

-- Allow administrators to delete daily workouts
CREATE POLICY "Administrators can delete daily workouts" 
ON public.daily_workouts 
FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'administrador'::app_role));