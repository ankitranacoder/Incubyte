package com.incubyte.dealership;

import com.incubyte.dealership.model.User;
import com.incubyte.dealership.model.Vehicle;
import com.incubyte.dealership.repository.UserRepository;
import com.incubyte.dealership.repository.VehicleRepository;
import com.incubyte.dealership.security.JwtTokenUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.hamcrest.Matchers.hasSize;

@SpringBootTest
@AutoConfigureMockMvc
public class VehicleControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenUtil jwtTokenUtil;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    private String userToken;
    private String adminToken;

    @BeforeEach
    public void setUp() {
        userRepository.deleteAll();
        vehicleRepository.deleteAll();

        // Create standard user
        User user = new User("std_user", passwordEncoder.encode("password"), "USER");
        userRepository.save(user);
        userToken = "Bearer " + jwtTokenUtil.generateToken("std_user", "USER");

        // Create admin user
        User admin = new User("admin_user", passwordEncoder.encode("password"), "ADMIN");
        userRepository.save(admin);
        adminToken = "Bearer " + jwtTokenUtil.generateToken("admin_user", "ADMIN");
    }

    @Test
    public void shouldAddVehicleSuccessfully() throws Exception {
        Vehicle vehicle = new Vehicle("Tesla", "Model S", "Electric", 89990.00, 5);

        mockMvc.perform(post("/api/vehicles")
                .header("Authorization", userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(vehicle)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.make").value("Tesla"))
                .andExpect(jsonPath("$.model").value("Model S"));
    }

    @Test
    public void shouldFailToAddVehicleUnauthenticated() throws Exception {
        Vehicle vehicle = new Vehicle("Tesla", "Model S", "Electric", 89990.00, 5);

        mockMvc.perform(post("/api/vehicles")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(vehicle)))
                .andExpect(status().isForbidden());
    }

    @Test
    public void shouldGetAvailableVehicles() throws Exception {
        vehicleRepository.save(new Vehicle("Toyota", "Camry", "Sedan", 25000.00, 10));
        vehicleRepository.save(new Vehicle("Ford", "F-150", "Truck", 45000.00, 0)); // Out of stock

        mockMvc.perform(get("/api/vehicles")
                .header("Authorization", userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    public void shouldSearchVehiclesSuccessfully() throws Exception {
        vehicleRepository.save(new Vehicle("Toyota", "Camry", "Sedan", 25000.00, 10));
        vehicleRepository.save(new Vehicle("Toyota", "RAV4", "SUV", 30000.00, 5));
        vehicleRepository.save(new Vehicle("Honda", "Civic", "Sedan", 22000.00, 8));

        // Search by make
        mockMvc.perform(get("/api/vehicles/search")
                .header("Authorization", userToken)
                .param("make", "Toyota"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));

        // Search by category and price range
        mockMvc.perform(get("/api/vehicles/search")
                .header("Authorization", userToken)
                .param("category", "Sedan")
                .param("minPrice", "23000.00")
                .param("maxPrice", "27000.00"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].model").value("Camry"));
    }

    @Test
    public void shouldUpdateVehicleSuccessfully() throws Exception {
        Vehicle savedVehicle = vehicleRepository.save(new Vehicle("Honda", "Civic", "Sedan", 22000.00, 8));
        savedVehicle.setPrice(23000.00);
        savedVehicle.setQuantity(10);

        mockMvc.perform(put("/api/vehicles/" + savedVehicle.getId())
                .header("Authorization", userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(savedVehicle)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.price").value(23000.00))
                .andExpect(jsonPath("$.quantity").value(10));
    }

    @Test
    public void shouldAllowAdminToDeleteVehicle() throws Exception {
        Vehicle savedVehicle = vehicleRepository.save(new Vehicle("Honda", "Civic", "Sedan", 22000.00, 8));

        mockMvc.perform(delete("/api/vehicles/" + savedVehicle.getId())
                .header("Authorization", adminToken))
                .andExpect(status().isOk());
    }

    @Test
    public void shouldDenyUserToDeleteVehicle() throws Exception {
        Vehicle savedVehicle = vehicleRepository.save(new Vehicle("Honda", "Civic", "Sedan", 22000.00, 8));

        mockMvc.perform(delete("/api/vehicles/" + savedVehicle.getId())
                .header("Authorization", userToken))
                .andExpect(status().isForbidden());
    }

    @Test
    public void shouldPurchaseVehicleSuccessfully() throws Exception {
        Vehicle savedVehicle = vehicleRepository.save(new Vehicle("Honda", "Civic", "Sedan", 22000.00, 8));

        mockMvc.perform(post("/api/vehicles/" + savedVehicle.getId() + "/purchase")
                .header("Authorization", userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantity").value(7));
    }

    @Test
    public void shouldFailToPurchaseOutOfStockVehicle() throws Exception {
        Vehicle savedVehicle = vehicleRepository.save(new Vehicle("Honda", "Civic", "Sedan", 22000.00, 0));

        mockMvc.perform(post("/api/vehicles/" + savedVehicle.getId() + "/purchase")
                .header("Authorization", userToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Vehicle is out of stock"));
    }

    @Test
    public void shouldAllowAdminToRestockVehicle() throws Exception {
        Vehicle savedVehicle = vehicleRepository.save(new Vehicle("Honda", "Civic", "Sedan", 22000.00, 8));

        mockMvc.perform(post("/api/vehicles/" + savedVehicle.getId() + "/restock")
                .header("Authorization", adminToken)
                .param("quantity", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantity").value(13));
    }

    @Test
    public void shouldDenyUserToRestockVehicle() throws Exception {
        Vehicle savedVehicle = vehicleRepository.save(new Vehicle("Honda", "Civic", "Sedan", 22000.00, 8));

        mockMvc.perform(post("/api/vehicles/" + savedVehicle.getId() + "/restock")
                .header("Authorization", userToken)
                .param("quantity", "5"))
                .andExpect(status().isForbidden());
    }
}
