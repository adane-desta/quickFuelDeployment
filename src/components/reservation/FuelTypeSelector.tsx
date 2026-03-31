// ... other imports ...

export function FuelTypeSelector({ stationId, onSelectFuel, selectedFuelTypeId, selectedQuantity = 10 }: FuelTypeSelectorProps) {
  // ... existing code ...

  const handleQuantityChange = (value: string) => {
    const num = parseInt(value);
    if (!isNaN(num) && num >= 5 && num <= 200) {
      setQuantity(num);
    }
  };

  // In the JSX:
  <Input
    id="quantity"
    type="number"
    min="5"
    max="200"
    step="1"
    value={quantity}
    onChange={(e) => handleQuantityChange(e.target.value)}
    className="text-lg font-semibold text-center"
  />
  <div className="flex flex-col gap-1">
    <button type="button" onClick={() => setQuantity(Math.min(200, quantity + 1))} className="...">+1</button>
    <button type="button" onClick={() => setQuantity(Math.max(5, quantity - 1))} className="...">-1</button>
  </div>
  // Quick select buttons: [5, 10, 20, 30, 50, 100] etc.
}