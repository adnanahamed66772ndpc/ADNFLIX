package com.adnflix.app.ui.screens.subscription

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.adnflix.app.data.model.PaymentMethod
import com.adnflix.app.data.model.SubscriptionPlanInfo
import com.adnflix.app.ui.theme.*
import com.adnflix.app.ui.viewmodel.SubscriptionViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SubscriptionScreen(
    onBackClick: () -> Unit,
    onPaymentSuccess: () -> Unit,
    viewModel: SubscriptionViewModel = hiltViewModel()
) {
    val plans by viewModel.plans.collectAsState()
    val paymentMethods by viewModel.paymentMethods.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val selectedPlan by viewModel.selectedPlan.collectAsState()
    val selectedPaymentMethod by viewModel.selectedPaymentMethod.collectAsState()
    val showPaymentDialog by viewModel.showPaymentDialog.collectAsState()
    
    Scaffold(
        topBar = {
            TopAppBar(
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back",
                            tint = Color.White
                        )
                    }
                },
                title = {
                    Text("Choose Your Plan", color = Color.White)
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Background
                )
            )
        },
        containerColor = Background
    ) { paddingValues ->
        if (isLoading && plans.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(color = Primary)
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                items(plans) { plan ->
                    PlanCard(
                        plan = plan,
                        isSelected = selectedPlan?.id == plan.id,
                        onClick = { viewModel.selectPlan(plan) }
                    )
                }
                
                if (selectedPlan != null && selectedPlan!!.price > 0) {
                    item {
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "Select Payment Method",
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp
                        )
                    }
                    
                    items(paymentMethods) { method ->
                        PaymentMethodCard(
                            method = method,
                            isSelected = selectedPaymentMethod?.id == method.id,
                            onClick = { viewModel.selectPaymentMethod(method) }
                        )
                    }
                    
                    item {
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(
                            onClick = { viewModel.showPaymentConfirmation() },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp),
                            enabled = selectedPlan != null && 
                                (selectedPlan!!.price == 0.0 || selectedPaymentMethod != null),
                            colors = ButtonDefaults.buttonColors(containerColor = Primary)
                        ) {
                            Text(
                                text = if (selectedPlan?.price == 0.0) "Continue with Free Plan" 
                                       else "Continue to Payment",
                                fontSize = 16.sp
                            )
                        }
                    }
                }
            }
        }
        
        // Payment Confirmation Dialog
        if (showPaymentDialog && selectedPlan != null && selectedPaymentMethod != null) {
            PaymentConfirmationDialog(
                plan = selectedPlan!!,
                method = selectedPaymentMethod!!,
                onDismiss = { viewModel.hidePaymentConfirmation() },
                onConfirm = { transactionId, senderNumber ->
                    viewModel.submitPayment(transactionId, senderNumber) {
                        onPaymentSuccess()
                    }
                },
                isSubmitting = isLoading
            )
        }
    }
}

@Composable
private fun PlanCard(
    plan: SubscriptionPlanInfo,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    val planColor = when (plan.id) {
        "premium" -> PlanPremium
        "with-ads" -> PlanBasic
        else -> PlanFree
    }
    
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .then(
                if (isSelected) {
                    Modifier.border(2.dp, planColor, RoundedCornerShape(16.dp))
                } else Modifier
            )
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(containerColor = Card),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    if (plan.popular) {
                        Icon(
                            imageVector = Icons.Filled.Star,
                            contentDescription = null,
                            tint = planColor,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                    }
                    Text(
                        text = plan.name,
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 20.sp
                    )
                }
                
                if (plan.popular) {
                    Box(
                        modifier = Modifier
                            .background(planColor, RoundedCornerShape(4.dp))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = "POPULAR",
                            color = Color.Black,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = if (plan.price > 0) "৳${plan.price.toInt()}/${plan.interval}" else "Free",
                color = planColor,
                fontWeight = FontWeight.Bold,
                fontSize = 24.sp
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            plan.features.forEach { feature ->
                Row(
                    modifier = Modifier.padding(vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Filled.Check,
                        contentDescription = null,
                        tint = Success,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = feature,
                        color = TextSecondary,
                        fontSize = 14.sp
                    )
                }
            }
        }
    }
}

@Composable
private fun PaymentMethodCard(
    method: PaymentMethod,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .then(
                if (isSelected) {
                    Modifier.border(2.dp, Primary, RoundedCornerShape(12.dp))
                } else Modifier
            )
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(containerColor = Card),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Logo placeholder
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(
                        try {
                            Color(android.graphics.Color.parseColor(method.color))
                        } catch (e: Exception) {
                            Primary
                        }
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = method.name.first().toString(),
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 20.sp
                )
            }
            
            Spacer(modifier = Modifier.width(16.dp))
            
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = method.name,
                    color = Color.White,
                    fontWeight = FontWeight.Medium
                )
                Text(
                    text = method.number,
                    color = TextSecondary,
                    fontSize = 12.sp
                )
            }
            
            RadioButton(
                selected = isSelected,
                onClick = onClick,
                colors = RadioButtonDefaults.colors(
                    selectedColor = Primary
                )
            )
        }
    }
}

@Composable
private fun PaymentConfirmationDialog(
    plan: SubscriptionPlanInfo,
    method: PaymentMethod,
    onDismiss: () -> Unit,
    onConfirm: (transactionId: String, senderNumber: String) -> Unit,
    isSubmitting: Boolean
) {
    var transactionId by remember { mutableStateOf("") }
    var senderNumber by remember { mutableStateOf("") }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Complete Payment") },
        text = {
            Column {
                Text(
                    text = "Send ৳${plan.price.toInt()} to:",
                    fontWeight = FontWeight.Medium
                )
                Spacer(modifier = Modifier.height(8.dp))
                
                Card(
                    colors = CardDefaults.cardColors(containerColor = Surface)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text(
                            text = method.name,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = method.number,
                            color = Primary,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                Text("Instructions:", fontWeight = FontWeight.Medium)
                Spacer(modifier = Modifier.height(8.dp))
                method.instructions.forEachIndexed { index, instruction ->
                    Text(
                        text = "${index + 1}. $instruction",
                        fontSize = 12.sp,
                        color = TextSecondary
                    )
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                OutlinedTextField(
                    value = transactionId,
                    onValueChange = { transactionId = it },
                    label = { Text("Transaction ID") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                OutlinedTextField(
                    value = senderNumber,
                    onValueChange = { senderNumber = it },
                    label = { Text("Your Phone Number") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { onConfirm(transactionId, senderNumber) },
                enabled = transactionId.isNotBlank() && senderNumber.isNotBlank() && !isSubmitting
            ) {
                if (isSubmitting) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        color = Color.White
                    )
                } else {
                    Text("Submit")
                }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
