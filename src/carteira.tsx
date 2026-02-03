import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CarteiraPage = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Minha Carteira</CardTitle>
      </CardHeader>
      <CardContent>
        <p>
          Aqui você poderá visualizar seus ganhos, histórico de pagamentos e
          solicitar saques.
        </p>
      </CardContent>
    </Card>
  );
};

export default CarteiraPage;
