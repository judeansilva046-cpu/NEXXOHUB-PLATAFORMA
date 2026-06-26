'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';

export default function AssessmentsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Avaliações</h1>
        <p className="text-gray-600 mt-2">Criar e gerenciar avaliações psicossociais</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Novas Avaliações</CardTitle>
            <CardDescription>Criar uma nova avaliação</CardDescription>
          </CardHeader>
          <CardContent>
            <Button>Nova Avaliação</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Avaliações Pendentes</CardTitle>
            <CardDescription>Avaliações aguardando resposta</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Nenhuma avaliação pendente</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Avaliações</CardTitle>
          <CardDescription>Todas as avaliações realizadas</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Nenhuma avaliação realizada ainda</p>
        </CardContent>
      </Card>
    </div>
  );
}
