package com.labcontrol.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.labcontrol.exception.ConflictException;
import com.labcontrol.exception.ResourceNotFoundException;
import com.labcontrol.model.Equipamento;
import com.labcontrol.service.EquipamentoService;
import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(EquipamentoController.class)
class EquipamentoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private EquipamentoService equipamentoService;

    @Test
    @DisplayName("POST /equipamentos -> 201 Created quando dados são válidos")
    void deveRetornar201AoCadastrarEquipamentoValido() throws Exception {
        Equipamento novo = new Equipamento("Espectrofotômetro UV-Vis", "PAT-10001", "Espectrometria", 2);
        Equipamento criado = new Equipamento(1L, "Espectrofotômetro UV-Vis", "PAT-10001", "Espectrometria", 2);

        when(equipamentoService.cadastrar(any(Equipamento.class))).thenReturn(criado);

        mockMvc.perform(post("/equipamentos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(novo)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.nome").value("Espectrofotômetro UV-Vis"))
                .andExpect(jsonPath("$.numeroPatrimonio").value("PAT-10001"))
                .andExpect(jsonPath("$.quantidade").value(2));
    }

    @Test
    @DisplayName("POST /equipamentos -> 400 Bad Request quando campos obrigatórios estão vazios ou quantidade é negativa")
    void deveRetornar400AoCadastrarComCamposInvalidos() throws Exception {
        // Nome menor que 3 caracteres, patrimonio vazio, categoria vazia, quantidade negativa
        Equipamento invalido = new Equipamento("AB", "", "", -1);

        mockMvc.perform(post("/equipamentos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalido)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.fieldErrors.nome").exists())
                .andExpect(jsonPath("$.fieldErrors.numeroPatrimonio").exists())
                .andExpect(jsonPath("$.fieldErrors.categoria").exists())
                .andExpect(jsonPath("$.fieldErrors.quantidade").exists());
    }

    @Test
    @DisplayName("POST /equipamentos -> 409 Conflict quando número de patrimônio já existe")
    void deveRetornar409AoCadastrarComPatrimonioDuplicado() throws Exception {
        Equipamento equipamento = new Equipamento("Balança Analítica", "PAT-10001", "Pesagem", 4);

        when(equipamentoService.cadastrar(any(Equipamento.class)))
                .thenThrow(new ConflictException("Já existe um equipamento cadastrado com o número de patrimônio: PAT-10001"));

        mockMvc.perform(post("/equipamentos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(equipamento)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("Já existe um equipamento cadastrado com o número de patrimônio: PAT-10001"));
    }

    @Test
    @DisplayName("GET /equipamentos -> 200 OK com lista de equipamentos")
    void deveRetornar200AoListarEquipamentos() throws Exception {
        List<Equipamento> lista = Arrays.asList(
                new Equipamento(1L, "Agitador Magnético", "PAT-10002", "Agitação", 5),
                new Equipamento(2L, "Banho Maria Digital", "PAT-10003", "Aquecimento", 2)
        );

        when(equipamentoService.listarTodos()).thenReturn(lista);

        mockMvc.perform(get("/equipamentos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].nome").value("Agitador Magnético"))
                .andExpect(jsonPath("$[1].nome").value("Banho Maria Digital"));
    }

    @Test
    @DisplayName("GET /equipamentos/{id} -> 200 OK quando equipamento existe")
    void deveRetornar200AoBuscarPorIdExistente() throws Exception {
        Equipamento equipamento = new Equipamento(1L, "Agitador Magnético", "PAT-10002", "Agitação", 5);

        when(equipamentoService.buscarPorId(1L)).thenReturn(equipamento);

        mockMvc.perform(get("/equipamentos/{id}", 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.nome").value("Agitador Magnético"));
    }

    @Test
    @DisplayName("GET /equipamentos/{id} -> 404 Not Found quando equipamento não existe")
    void deveRetornar404AoBuscarPorIdInexistente() throws Exception {
        when(equipamentoService.buscarPorId(99L))
                .thenThrow(new ResourceNotFoundException("Equipamento não encontrado com o ID: 99"));

        mockMvc.perform(get("/equipamentos/{id}", 99L))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Equipamento não encontrado com o ID: 99"));
    }

    @Test
    @DisplayName("PUT /equipamentos/{id} -> 200 OK com dados atualizados")
    void deveRetornar200AoAtualizarEquipamento() throws Exception {
        Equipamento dadosNovos = new Equipamento("Agitador Magnético Aquecido", "PAT-10002", "Agitação", 6);
        Equipamento atualizado = new Equipamento(1L, "Agitador Magnético Aquecido", "PAT-10002", "Agitação", 6);

        when(equipamentoService.atualizar(eq(1L), any(Equipamento.class))).thenReturn(atualizado);

        mockMvc.perform(put("/equipamentos/{id}", 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dadosNovos)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.nome").value("Agitador Magnético Aquecido"))
                .andExpect(jsonPath("$.quantidade").value(6));
    }

    @Test
    @DisplayName("PUT /equipamentos/{id} -> 404 Not Found ao atualizar ID inexistente")
    void deveRetornar404AoAtualizarIdInexistente() throws Exception {
        Equipamento dadosNovos = new Equipamento("Agitador Magnético Aquecido", "PAT-10002", "Agitação", 6);

        when(equipamentoService.atualizar(eq(99L), any(Equipamento.class)))
                .thenThrow(new ResourceNotFoundException("Equipamento não encontrado com o ID: 99"));

        mockMvc.perform(put("/equipamentos/{id}", 99L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dadosNovos)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    @DisplayName("PUT /equipamentos/{id} -> 409 Conflict ao atualizar com patrimônio conflitante")
    void deveRetornar409AoAtualizarComPatrimonioConflitante() throws Exception {
        Equipamento dadosNovos = new Equipamento("Agitador Magnético Aquecido", "PAT-CONFLITO", "Agitação", 6);

        when(equipamentoService.atualizar(eq(1L), any(Equipamento.class)))
                .thenThrow(new ConflictException("Já existe outro equipamento cadastrado com o número de patrimônio: PAT-CONFLITO"));

        mockMvc.perform(put("/equipamentos/{id}", 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dadosNovos)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
    }

    @Test
    @DisplayName("DELETE /equipamentos/{id} -> 204 No Content quando excluído com sucesso")
    void deveRetornar204AoExcluirEquipamento() throws Exception {
        doNothing().when(equipamentoService).excluir(1L);

        mockMvc.perform(delete("/equipamentos/{id}", 1L))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("DELETE /equipamentos/{id} -> 404 Not Found quando ID a excluir não existe")
    void deveRetornar404AoExcluirIdInexistente() throws Exception {
        doThrow(new ResourceNotFoundException("Equipamento não encontrado com o ID: 99"))
                .when(equipamentoService).excluir(99L);

        mockMvc.perform(delete("/equipamentos/{id}", 99L))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }
}
