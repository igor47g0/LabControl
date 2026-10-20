package com.labcontrol.controller;

import com.labcontrol.model.Equipamento;
import com.labcontrol.service.EquipamentoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/equipamentos")
@CrossOrigin(origins = "*")
@Tag(name = "Equipamentos", description = "Endpoints de gerenciamento do inventário de equipamentos laboratoriais")
public class EquipamentoController {

    private final EquipamentoService equipamentoService;

    public EquipamentoController(EquipamentoService equipamentoService) {
        this.equipamentoService = equipamentoService;
    }

    /**
     * POST /equipamentos -> Cadastrar novo equipamento.
     * Retorno: 201 Created com o JSON do item criado.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Cadastrar novo equipamento", description = "Cadastra um novo equipamento com validação de campos e unicidade do patrimônio.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Equipamento criado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados de entrada inválidos"),
            @ApiResponse(responseCode = "409", description = "Número de patrimônio já cadastrado")
    })
    public ResponseEntity<Equipamento> cadastrar(@Valid @RequestBody Equipamento equipamento) {
        Equipamento criado = equipamentoService.cadastrar(equipamento);
        return ResponseEntity.status(HttpStatus.CREATED).body(criado);
    }

    /**
     * GET /equipamentos -> Listar todos os equipamentos.
     * Retorno: 200 OK com a lista JSON.
     */
    @GetMapping
    @Operation(summary = "Listar todos os equipamentos", description = "Retorna a lista de todos os equipamentos cadastrados no laboratório.")
    @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso")
    public ResponseEntity<List<Equipamento>> listarTodos() {
        List<Equipamento> lista = equipamentoService.listarTodos();
        return ResponseEntity.ok(lista);
    }

    /**
     * GET /equipamentos/{id} -> Buscar por ID.
     * Retorno: 200 OK com o item ou 404 Not Found se não existir.
     */
    @GetMapping("/{id}")
    @Operation(summary = "Buscar equipamento por ID", description = "Retorna os detalhes de um equipamento específico pelo identificador.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Equipamento encontrado"),
            @ApiResponse(responseCode = "404", description = "Equipamento não encontrado")
    })
    public ResponseEntity<Equipamento> buscarPorId(@PathVariable Long id) {
        Equipamento equipamento = equipamentoService.buscarPorId(id);
        return ResponseEntity.ok(equipamento);
    }

    /**
     * PUT /equipamentos/{id} -> Atualizar equipamento.
     * Retorno: 200 OK com o JSON atualizado ou 404 Not Found se não existir.
     */
    @PutMapping("/{id}")
    @Operation(summary = "Atualizar equipamento", description = "Atualiza os dados de um equipamento existente pelo ID.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Equipamento atualizado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados de entrada inválidos"),
            @ApiResponse(responseCode = "404", description = "Equipamento não encontrado"),
            @ApiResponse(responseCode = "409", description = "Número de patrimônio em conflito com outro equipamento")
    })
    public ResponseEntity<Equipamento> atualizar(
            @PathVariable Long id,
            @Valid @RequestBody Equipamento equipamento) {
        Equipamento atualizado = equipamentoService.atualizar(id, equipamento);
        return ResponseEntity.ok(atualizado);
    }

    /**
     * DELETE /equipamentos/{id} -> Excluir equipamento.
     * Retorno: 204 No Content ou 404 Not Found se não existir.
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir equipamento", description = "Remove um equipamento do banco de dados pelo ID.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Equipamento excluído com sucesso"),
            @ApiResponse(responseCode = "404", description = "Equipamento não encontrado")
    })
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        equipamentoService.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
