export function Injectable(): ClassDecorator {
  return (target: any) => {
    // Keep it simple for now, can be extended for scoping (Singleton, Transient)
  };
}
